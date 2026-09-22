import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SchemaImportDialog from "../components/SchemaImportDialog/SchemaImportDialog";
import { applyRepoSchemaImport, getRepoSchemaImport, previewRepoSchemaImport } from "../services/app.service";
import { SchemaImportPreview } from "../types";

const mockPermission = jest.fn();
jest.mock("../usercontext", () => ({ useUserContext: () => ({ hasPermission: mockPermission }) }));
jest.mock("../services/app.service", () => ({ getRepoSchemaImport: jest.fn(), previewRepoSchemaImport: jest.fn(), applyRepoSchemaImport: jest.fn() }));
const source = { package: "ogrre_data_cleaning", version: "1.2", collaborator: "isgs" };
const diff = { added: ["new"], retired: ["old"], changed: [], metadata: [] };
const response = (body: unknown, status = 200) => ({ status, json: async () => body });
const plan = (changes: Partial<SchemaImportPreview> = {}): SchemaImportPreview => ({
  source, import_id: "saved-preview", status: "preview", mode: "add", can_apply: true, destructive: false,
  counts: { added: 1, updated: 0, kept: 0, unchanged: 0, conflict: 0, removed: 0, detached: 0 },
  entries: [{ source_id: "well", name: "Well", action: "added", candidates: [], groups: [], diff }],
  removed: [], affected_groups: [], detached_groups: [], errors: [], next_step: 0, total_steps: 1, ...changes,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission.mockReturnValue(true);
  (getRepoSchemaImport as jest.Mock).mockResolvedValue(response({ source, schemas: [{ source_id: "well", name: "Well", field_count: 2 }], busy: false }));
  (previewRepoSchemaImport as jest.Mock).mockResolvedValue(response(plan()));
  (applyRepoSchemaImport as jest.Mock).mockResolvedValue(response(plan({ status: "complete" })));
});

async function openPreview() {
  await screen.findByLabelText("Well · 2 fields");
  fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
  await screen.findByText("1 added");
}

test("Add requires review and confirmation, and sends only the saved preview ID", async () => {
  const onApplied = jest.fn();
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={onApplied} />);
  await openPreview();
  expect(previewRepoSchemaImport).toHaveBeenCalledWith({ mode: "add", selected: ["well"], decisions: {} });
  expect(applyRepoSchemaImport).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Import selected schemas" }));
  await screen.findByText("Schema import complete.");
  expect(applyRepoSchemaImport).toHaveBeenCalledWith("saved-preview");
  expect(onApplied).toHaveBeenCalledTimes(1);
});

test("safe managers can keep conflicts but cannot replace schemas or the catalog", async () => {
  mockPermission.mockImplementation(permission => permission !== "manage_schema_destructive");
  const conflict = plan({ can_apply: false, counts: { ...plan().counts, added: 0, conflict: 1 }, entries: [{ source_id: "well", name: "Well", action: "conflict", groups: [], candidates: [{ schema_id: "existing", name: "Current well", diff, groups: [] }] }] });
  (previewRepoSchemaImport as jest.Mock).mockResolvedValueOnce(response(conflict)).mockResolvedValueOnce(response(plan({ counts: { ...plan().counts, added: 0, kept: 1 }, entries: [{ ...conflict.entries[0], action: "kept" }] })));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByLabelText("Well · 2 fields");
  expect(screen.getByLabelText("Replace the schema catalog")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
  await screen.findByText(/Resolve each conflict/);
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  fireEvent.mouseDown(screen.getByLabelText("Decision for Well"));
  expect(screen.queryByRole("option", { name: "Use repo version" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: "Keep existing" }));
  fireEvent.click(screen.getByRole("button", { name: "Update preview" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  expect(previewRepoSchemaImport).toHaveBeenLastCalledWith({ mode: "add", selected: ["well"], decisions: { well: { action: "keep", schema_id: "existing" } } });
});

test("Replace names detached groups and uses a concrete final action", async () => {
  const group = { id: "group", name: "Shared records", team: "Other team" };
  (previewRepoSchemaImport as jest.Mock).mockResolvedValue(response(plan({ mode: "replace", destructive: true,
    counts: { ...plan().counts, removed: 1, detached: 1 }, affected_groups: [group], detached_groups: [group],
    removed: [{ schema_id: "old", name: "Old schema", groups: [group] }],
  })));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByLabelText("Well · 2 fields");
  fireEvent.click(screen.getByLabelText("Replace the schema catalog"));
  fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
  await screen.findByText(/Their records and stored fields are preserved/);
  fireEvent.click(screen.getByRole("button", { name: "Record groups to detach (1)" }));
  expect(screen.getAllByText("Shared records · Other team").some(node => !!node)).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("button", { name: "Replace schemas and detach 1 group" })).toBeEnabled();
  expect(applyRepoSchemaImport).not.toHaveBeenCalled();
});

test("a stale apply stays open and requires another preview", async () => {
  (applyRepoSchemaImport as jest.Mock).mockResolvedValue(response({ detail: "The catalog changed. Review a new preview." }, 409));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await openPreview();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Import selected schemas" }));
  await screen.findByText("The catalog changed. Review a new preview.");
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Update preview" })).toBeEnabled();
});

test("an unfinished import can be reopened and resumed without creating another plan", async () => {
  const partial = plan({ status: "partial", error: "Import paused. Retry to continue." });
  (getRepoSchemaImport as jest.Mock).mockResolvedValue(response({ source, schemas: [], pending_import: partial, busy: false }));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review saved import" }));
  expect(screen.getByText("Import paused. Retry to continue.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Resume import" }));
  await screen.findByText("Schema import complete.");
  expect(applyRepoSchemaImport).toHaveBeenCalledWith(partial.import_id);
  expect(previewRepoSchemaImport).not.toHaveBeenCalled();
});

test("invalid package schemas cannot be selected", async () => {
  (getRepoSchemaImport as jest.Mock).mockResolvedValue(response({ source, schemas: [{ source_id: "invalid", name: "Invalid schema", error: "Missing schema file" }], busy: false }));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByText("Missing schema file");
  expect(screen.getByLabelText("Invalid schema")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Preview import" })).toBeDisabled();
});
