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
  source, import_id: "saved-preview", status: "preview", mode: "refresh", can_apply: true, destructive: true,
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

test("Refresh from repo is the default mode, requires confirmation, and applies successfully", async () => {
  const onApplied = jest.fn();
  (previewRepoSchemaImport as jest.Mock).mockResolvedValue(response(plan({ mode: "refresh" })));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={onApplied} />);
  await openPreview();
  expect(previewRepoSchemaImport).toHaveBeenCalledWith({ mode: "refresh", selected: ["well"], decisions: {} });
  expect(applyRepoSchemaImport).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh schemas from repo" }));
  await screen.findByText("Schema import complete.");
  expect(applyRepoSchemaImport).toHaveBeenCalledWith("saved-preview");
  expect(onApplied).toHaveBeenCalledTimes(1);
});

test("safe managers without destructive permission can preview and run refresh mode", async () => {
  mockPermission.mockImplementation(permission => permission !== "manage_schema_destructive");
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByLabelText("Well · 2 fields");
  expect(screen.getByLabelText("Refresh from repo (recommended)")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Preview import" })).toBeEnabled();
});

test("a stale apply stays open and requires another preview", async () => {
  (applyRepoSchemaImport as jest.Mock).mockResolvedValue(response({ detail: "The catalog changed. Review a new preview." }, 409));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await openPreview();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh schemas from repo" }));
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

test("Refresh mode omits decision dropdowns and displays info summary", async () => {
  (previewRepoSchemaImport as jest.Mock).mockResolvedValue(response(plan({
    mode: "refresh",
    counts: { ...plan().counts, added: 0, updated: 1, removed: 1, detached: 0 },
    removed: [{ schema_id: "unused", name: "Unused schema", groups: [] }],
    entries: [{ source_id: "well", name: "Well", action: "updated", candidates: [{ schema_id: "existing", name: "Well", diff, groups: [] }], groups: [], diff }],
  })));
  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByLabelText("Well · 2 fields");
  fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
  await screen.findByText(/Refreshing schemas will update matching schemas in place/);
  expect(screen.queryByLabelText(/Decision for/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
});

test("can select GitHub source, fetch from custom branch/ref, and include source in preview request", async () => {
  const githubSource = {
    type: "github" as const,
    package: "ogrre_data_cleaning",
    version: "feature-branch",
    collaborator: "isgs",
    repo: "CATALOG-Historic-Records/OGRRE_data_cleaning",
    ref: "feature-branch",
  };
  (getRepoSchemaImport as jest.Mock).mockImplementation((options) => {
    if (options?.source_type === "github") {
      const isFeatureBranch = options.ref === "feature-branch";
      return Promise.resolve(response({
        source: { ...githubSource, ref: options.ref || "main", version: options.ref || "main" },
        schemas: isFeatureBranch
          ? [{ source_id: "feature_well", name: "Feature Well", field_count: 5 }]
          : [{ source_id: "remote_well", name: "Remote Well", field_count: 3 }],
        busy: false,
      }));
    }
    return Promise.resolve(response({ source, schemas: [{ source_id: "well", name: "Well", field_count: 2 }], busy: false }));
  });
  (previewRepoSchemaImport as jest.Mock).mockResolvedValue(response(plan({
    source: githubSource,
    entries: [{ source_id: "feature_well", name: "Feature Well", action: "added", candidates: [], groups: [], diff }],
  })));

  render(<SchemaImportDialog onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByLabelText("Well · 2 fields");

  // Switch to GitHub source
  fireEvent.click(screen.getByLabelText("GitHub branch or commit"));
  await screen.findByLabelText("Remote Well · 3 fields");
  expect(getRepoSchemaImport).toHaveBeenCalledWith({
    source_type: "github",
    ref: "main",
    repo: "CATALOG-Historic-Records/OGRRE_data_cleaning",
  });

  // Change ref to feature-branch and click Fetch
  const refInput = screen.getByLabelText("Branch, tag, or commit");
  fireEvent.change(refInput, { target: { value: "feature-branch" } });
  fireEvent.click(screen.getByRole("button", { name: "Fetch" }));
  await screen.findByLabelText("Feature Well · 5 fields");
  expect(getRepoSchemaImport).toHaveBeenCalledWith({
    source_type: "github",
    ref: "feature-branch",
    repo: "CATALOG-Historic-Records/OGRRE_data_cleaning",
  });

  // Click Preview import
  fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
  await screen.findByText("1 added");
  expect(previewRepoSchemaImport).toHaveBeenCalledWith({
    mode: "refresh",
    selected: ["feature_well"],
    decisions: {},
    source: {
      type: "github",
      repo: "CATALOG-Historic-Records/OGRRE_data_cleaning",
      ref: "feature-branch",
    },
  });

  // Check the banner displays the GitHub source info
  expect(screen.getByText(/GitHub CATALOG-Historic-Records\/OGRRE_data_cleaning @ feature-branch · isgs/)).toBeInTheDocument();
});

