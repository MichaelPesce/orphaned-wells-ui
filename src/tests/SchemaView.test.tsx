import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SchemaView from "../views/SchemaView/SchemaView";
import { createSchema, getCleaningFunctions, getSchema, updateProcessorAttribute } from "../services/app.service";

const mockHasPermission = jest.fn();
jest.mock("../usercontext", () => ({ useUserContext: () => ({ hasPermission: mockHasPermission }) }));
jest.mock("../services/app.service", () => ({
  getSchema: jest.fn(), getCleaningFunctions: jest.fn(), updateProcessorAttribute: jest.fn(),
  uploadProcessorSchema: jest.fn(), deleteProcessorSchema: jest.fn(), updateProcessor: jest.fn(),
  uploadSampleImage: jest.fn(),
  createSchema: jest.fn(),
}));

const processor = {
  schema_id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  name: "Well schema", displayName: "Well schema", processorId: "processor", modelId: "model", documentType: "Well",
  attributes: [{ name: "depth", alias: "Depth", data_type: "Plain text", database_data_type: "float", page_order_sort: 1 }],
};
const response = (body: unknown, status = 200) => ({ status, json: async () => body });

beforeEach(() => {
  jest.clearAllMocks();
  mockHasPermission.mockImplementation(permission => permission === "manage_schema");
  (getSchema as jest.Mock).mockResolvedValue(response({ processors: [processor], source: "database", read_only: false }));
  (getCleaningFunctions as jest.Mock).mockResolvedValue(response({ cleaning_functions: ["string_to_float"] }));
  (updateProcessorAttribute as jest.Mock).mockResolvedValue(response("success"));
});

async function openFields() {
  render(<MemoryRouter><SchemaView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("tab", { name: "Well schema" }));
  await screen.findByText("Depth");
}

test("repo schemas are visible and read-only even for administrators", async () => {
  mockHasPermission.mockReturnValue(true);
  (getSchema as jest.Mock).mockResolvedValue(response({ processors: [processor], source: "repo", read_only: true }));
  await openFields();
  expect(screen.getByText(/Repo schemas are read-only/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Create schema" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add field" })).not.toBeInTheDocument();
});

test("schema managers can edit aliases and types but cannot rename or remove fields", async () => {
  await openFields();
  expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.queryByRole("textbox", { name: /Field name/i })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Data type")).toBeInTheDocument();
  expect(screen.getByLabelText("Database data type")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Measured depth" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Measured depth");
  expect(updateProcessorAttribute).toHaveBeenCalledWith("Well schema", "depth", { alias: "Measured depth" }, "update", processor.schema_id);
});

test.each([
  { label: "Data type", option: "Number", updates: { data_type: "Number" } },
  { label: "Database data type", option: "int", updates: { database_data_type: "int" } },
  { label: "Data type", option: "Checkbox", updates: { data_type: "Checkbox", database_data_type: "bool" } },
])("schema managers can save $label as $option", async ({ label, option, updates }) => {
  await openFields();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole("option", { name: option }));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(updateProcessorAttribute).toHaveBeenCalledWith("Well schema", "depth", updates, "update", processor.schema_id));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument());
  expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
});

test("administrators get type and removal controls but field names remain immutable", async () => {
  mockHasPermission.mockReturnValue(true);
  await openFields();
  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByLabelText("Data type")).toBeInTheDocument();
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
});

test("a failed save keeps the draft open and allows retry without changing the saved schema", async () => {
  (updateProcessorAttribute as jest.Mock).mockResolvedValueOnce(response({ detail: "Schema changed" }, 409));
  await openFields();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Measured depth" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText(/Failed to update schema field: Schema changed/);
  expect(screen.getByRole("textbox")).toHaveValue("Measured depth");
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
  expect(screen.getByText("Measured depth")).toBeInTheDocument();
});

test("failed field creation keeps its dialog and entered values", async () => {
  (updateProcessorAttribute as jest.Mock).mockResolvedValue(response({ detail: "Duplicate field" }, 409));
  await openFields();
  fireEvent.click(screen.getByRole("button", { name: "Add field" }));
  fireEvent.change(screen.getByRole("textbox", { name: /Field Name/ }), { target: { value: "new_field" } });
  fireEvent.mouseDown(screen.getByLabelText("Data type"));
  fireEvent.click(screen.getByRole("option", { name: "Plain text" }));
  fireEvent.click(screen.getByRole("button", { name: "Add Field" }));
  await screen.findByText(/Failed to update schema field: Duplicate field/);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /Field Name/ })).toHaveValue("new_field");
});

test("schema managers can create an empty schema without processor identifiers", async () => {
  (createSchema as jest.Mock).mockResolvedValue(response({ schema_id: "new" }));
  render(<MemoryRouter><SchemaView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Create schema" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Schema Name" }), { target: { value: "Imported" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Display Name" }), { target: { value: "Imported" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Document Type" }), { target: { value: "Well" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(createSchema).toHaveBeenCalledWith({ name: "Imported", displayName: "Imported", documentType: "Well", processorId: null, modelId: null, attributes: [] }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
