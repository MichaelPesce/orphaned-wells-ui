import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import SchemaGenerationDialog from "../components/SchemaGenerationDialog/SchemaGenerationDialog";
import { applyRecordGroupSchema, getCleaningFunctions, previewRecordGroupSchema } from "../services/app.service";
import { RecordGroup, SchemaGenerationPreview } from "../types";

jest.mock("../usercontext", () => ({ useUserContext: () => ({ hasPermission: (permission: string) => permission === "manage_schema" }) }));
jest.mock("../services/app.service", () => ({ applyRecordGroupSchema: jest.fn(), previewRecordGroupSchema: jest.fn(), getCleaningFunctions: jest.fn() }));

const group: RecordGroup = { _id: "group", name: "Records", has_schema: false, has_records: true, schema_source: "database" };
const field = { name: "depth", data_type: "Number", database_data_type: "int", page_order_sort: 1 };
const preview: SchemaGenerationPreview = {
  preview_id: "preview", mode: "generate", status: "preview", schema_id: null, schema_name: null,
  name: "Records schema", documentType: "Imported records", fields: [field],
  field_notes: { depth: ["Numeric-looking text; review the suggested type."] },
  warnings: ["This preview covers a bounded sample; other fields may exist outside it."],
  sampled_records: 2, examined_records: 2, record_limit: 2, sample_capped: true, oversized_records: 0,
};
const response = (body: unknown, status = 200) => ({ status, json: async () => body });

beforeEach(() => {
  jest.clearAllMocks();
  (previewRecordGroupSchema as jest.Mock).mockResolvedValue(response(preview));
  (getCleaningFunctions as jest.Mock).mockResolvedValue(response({ cleaning_functions: [] }));
  (applyRecordGroupSchema as jest.Mock).mockResolvedValue(response({ ...group, has_schema: true, schema_id: "new", active_schema_id: "new" }));
});

test("generation requires final confirmation and saves editable suggestions", async () => {
  const applied = jest.fn();
  render(<SchemaGenerationDialog group={group} onClose={jest.fn()} onApplied={applied} />);
  await screen.findByText("Reviewed 2 records (maximum 2). Found 1 fields.");
  expect(applyRecordGroupSchema).not.toHaveBeenCalled();
  expect(screen.getByText(/bounded sample/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add field" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByRole("button", { name: "Create and attach schema" })).toBeDisabled();
  const row = screen.getByText("depth").closest("tr")!;
  fireEvent.change(within(row).getByRole("textbox"), { target: { value: "Measured depth" } });
  fireEvent.click(within(row).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Create and attach schema" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Create and attach schema" }));
  await waitFor(() => expect(applied).toHaveBeenCalled());
  expect(applyRecordGroupSchema).toHaveBeenCalledWith("group", {
    preview_id: "preview", name: "Records schema", documentType: "Imported records", fields: [{ ...field, alias: "Measured depth" }],
  });
});

test("extension warns about shared effects and sends only new fields", async () => {
  (previewRecordGroupSchema as jest.Mock).mockResolvedValue(response({ ...preview, mode: "extend", schema_id: "shared", schema_name: "Shared wells" }));
  render(<SchemaGenerationDialog group={{ ...group, has_schema: true }} onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByText(/These additions update Shared wells for every record group/);
  expect(previewRecordGroupSchema).toHaveBeenCalledWith("group", "extend");
  expect(screen.queryByRole("textbox", { name: "Schema name" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add fields to shared schema" }));
  await waitFor(() => expect(applyRecordGroupSchema).toHaveBeenCalledWith("group", { preview_id: "preview", fields: [field] }));
  await waitFor(() => expect(screen.queryByLabelText("Loading schema preview")).not.toBeInTheDocument());
});

test("failed saves retain drafts and retry the same request after a lost response", async () => {
  (applyRecordGroupSchema as jest.Mock).mockResolvedValueOnce(response({ detail: "Save interrupted. Retry." }, 503));
  const applied = jest.fn();
  render(<SchemaGenerationDialog group={group} onClose={jest.fn()} onApplied={applied} />);
  await screen.findByRole("textbox", { name: "Schema name" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Create and attach schema" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Create and attach schema" }));
  await screen.findByText("Save interrupted. Retry.");
  expect(applied).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "Schema name" })).toHaveValue("Records schema");
  expect(screen.getByRole("textbox", { name: "Schema name" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
  await waitFor(() => expect(applied).toHaveBeenCalled());
  expect((applyRecordGroupSchema as jest.Mock).mock.calls[0]).toEqual((applyRecordGroupSchema as jest.Mock).mock.calls[1]);
});

test("stale previews keep the dialog open and allow a fresh preview", async () => {
  (applyRecordGroupSchema as jest.Mock).mockResolvedValue(response({ detail: "The schema changed. Generate a new preview." }, 409));
  render(<SchemaGenerationDialog group={group} onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByRole("textbox", { name: "Schema name" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Create and attach schema" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Create and attach schema" }));
  await screen.findByText("The schema changed. Generate a new preview.");
  fireEvent.click(screen.getByRole("button", { name: "Refresh preview" }));
  await waitFor(() => expect(previewRecordGroupSchema).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByLabelText("Loading schema preview")).not.toBeInTheDocument());
});

test("an empty preview cannot be applied", async () => {
  (previewRecordGroupSchema as jest.Mock).mockResolvedValue(response({ ...preview, fields: [], field_notes: {} }));
  render(<SchemaGenerationDialog group={group} onClose={jest.fn()} onApplied={jest.fn()} />);
  await screen.findByText("No usable fields were found in this sample.");
  expect(screen.getByRole("button", { name: "Create and attach schema" })).toBeDisabled();
  expect(applyRecordGroupSchema).not.toHaveBeenCalled();
});
