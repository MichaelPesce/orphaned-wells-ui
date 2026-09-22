import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ConnectProcessorDialog from "../components/ConnectProcessorDialog/ConnectProcessorDialog";
import NewRecordGroupDialog from "../components/NewRecordGroupDialog/NewRecordGroupDialog";
import EditProcessorDialog from "../components/EditProcessorDialog/EditProcessorDialog";
import { addRecordGroup, getProcessors, updateProcessor, updateRecordGroup } from "../services/app.service";

const mockHasPermission = jest.fn();
jest.mock("../usercontext", () => ({ useUserContext: () => ({ hasPermission: mockHasPermission }) }));
jest.mock("../services/app.service", () => ({
  getProcessors: jest.fn(), updateRecordGroup: jest.fn(), connectRecordGroupProcessor: jest.fn(),
  addRecordGroup: jest.fn(), updateProcessor: jest.fn(), uploadSampleImage: jest.fn(),
}));
const schemas = [
  { schema_id: "one", name: "Without processor", documentType: "Imported" },
  { schema_id: "two", name: "First extractor", documentType: "Well", processorId: "shared", modelId: "one" },
  { schema_id: "three", name: "Second extractor", documentType: "Well", processorId: "shared", modelId: "two" },
];
const response = (body: unknown, status = 200) => ({ status, json: async () => body });

beforeEach(() => {
  jest.clearAllMocks();
  mockHasPermission.mockReturnValue(true);
  (getProcessors as jest.Mock).mockResolvedValue(response({ USE_DB_PROCESSORS: true, processor_list: schemas }));
  (updateRecordGroup as jest.Mock).mockResolvedValue(response({ _id: "group" }));
  (addRecordGroup as jest.Mock).mockResolvedValue(response("group"));
});

test("schema selection distinguishes shared processor IDs and permits processor-free schemas", async () => {
  render(<ConnectProcessorDialog open recordGroup={{ _id: "group", name: "Records", schema_id: "two", active_schema_id: "two" }} onClose={jest.fn()} onConnected={jest.fn()} setErrorMsg={jest.fn()} />);
  fireEvent.click(await screen.findByRole("button", { name: /Second extractor/ }));
  fireEvent.click(screen.getByRole("button", { name: "Use schema" }));
  await waitFor(() => expect(updateRecordGroup).toHaveBeenCalledWith("group", { schema_id: "three" }));
  await waitFor(() => expect(screen.getByRole("button", { name: /Without processor/ })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: /Without processor/ }));
  fireEvent.click(screen.getByRole("button", { name: "Use schema" }));
  await waitFor(() => expect(updateRecordGroup).toHaveBeenCalledWith("group", { schema_id: "one" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Use schema" })).toBeEnabled());
});

test("detach warns that records are preserved and sends an explicit null binding", async () => {
  render(<ConnectProcessorDialog open recordGroup={{ _id: "group", name: "Records", schema_id: "two" }} onClose={jest.fn()} onConnected={jest.fn()} setErrorMsg={jest.fn()} />);
  fireEvent.click(await screen.findByRole("button", { name: "No schema" }));
  expect(screen.getByText(/stored fields are preserved/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Detach schema" }));
  await waitFor(() => expect(updateRecordGroup).toHaveBeenCalledWith("group", { schema_id: null }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Detach schema" })).toBeEnabled());
});

test("new groups use schema IDs even when extraction identifiers are absent", async () => {
  render(<MemoryRouter><NewRecordGroupDialog open project_id="project" onClose={jest.fn()} /></MemoryRouter>);
  fireEvent.change(screen.getByRole("textbox", { name: "Record Group Name" }), { target: { value: "Records" } });
  fireEvent.click(await screen.findByRole("button", { name: /Without processor/ }));
  fireEvent.click(screen.getByRole("button", { name: "Create Record Group" }));
  await waitFor(() => expect(addRecordGroup).toHaveBeenCalledWith(expect.objectContaining({ schema_id: "one", project_id: "project" })));
  await waitFor(() => expect(screen.getByRole("button", { name: "Create Record Group" })).toBeEnabled());
  expect((addRecordGroup as jest.Mock).mock.calls[0][0]).not.toHaveProperty("attributes");
  expect((addRecordGroup as jest.Mock).mock.calls[0][0]).not.toHaveProperty("processorId");
});

test("safe metadata edits remain available without a processor and preserve binding fields", async () => {
  mockHasPermission.mockImplementation(permission => permission !== "manage_schema_destructive");
  (updateProcessor as jest.Mock).mockResolvedValue(response({ detail: "Try again" }, 409));
  render(<EditProcessorDialog open processorData={schemas[0]} onClose={jest.fn()} setErrorMsg={jest.fn()} clickUpdateFields={jest.fn()} />);
  expect(screen.getByLabelText("Processor ID")).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Display Name" }), { target: { value: "Renamed display" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(updateProcessor).toHaveBeenCalledWith(expect.objectContaining({ schema_id: "one", displayName: "Renamed display" })));
  await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  expect((updateProcessor as jest.Mock).mock.calls[0][0]).not.toHaveProperty("processorId");
});
