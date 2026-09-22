import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import ProjectPage from "../views/ProjectPage/ProjectPage";
import { getRecordGroups } from "../services/app.service";

jest.mock("../services/app.service", () => ({ getRecordGroups: jest.fn() }));
jest.mock("../components/NewRecordGroupDialog/NewRecordGroupDialog", () => () => null);
jest.mock("../components/JsonImportDialog/JsonImportDialog", () => () => null);
jest.mock("../components/RecordsTable/RecordsTable", () => () => <div>All project records</div>);
jest.mock("../components/RecordGroupsTable/RecordGroupsTable", () => ({ record_groups, loading }: any) => (
  loading ? <div>Loading record groups</div> : <table aria-label="Record groups">
    <tbody>{record_groups.map((group: any) => <tr key={group._id}><td>{group.name}</td></tr>)}</tbody>
  </table>
));

const response = (body: unknown, status = 200) => ({ status, json: async () => body });
const project = (id = "project") => response({
  project: { _id: id, name: `Project ${id}` },
  record_groups: [{ _id: `${id}-group`, name: `Group ${id}` }],
});
const renderProject = () => render(
  <MemoryRouter initialEntries={["/project/project"]}>
    <Link to="/project/second">Next project</Link>
    <Routes><Route path="/project/:id" element={<ProjectPage />} /></Routes>
  </MemoryRouter>
);

beforeEach(() => jest.clearAllMocks());

test("shows the backend error and retries project loading successfully", async () => {
  (getRecordGroups as jest.Mock)
    .mockResolvedValueOnce(response({ detail: "The project could not be loaded." }, 409))
    .mockResolvedValueOnce(project());
  renderProject();
  expect(await screen.findByRole("alert")).toHaveTextContent("The project could not be loaded.");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Group project")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(getRecordGroups).toHaveBeenCalledTimes(2);
});

test("keeps existing project data visible when a refresh fails", async () => {
  (getRecordGroups as jest.Mock)
    .mockResolvedValueOnce(project())
    .mockRejectedValueOnce(new Error("Connection lost"))
    .mockResolvedValueOnce(project());
  renderProject();
  await screen.findByText("Group project");
  fireEvent.click(screen.getByRole("tab", { name: "All Records" }));
  fireEvent.click(screen.getByRole("tab", { name: "Record Groups" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Connection lost");
  expect(screen.getByText("Group project")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(await screen.findByText("Group project")).toBeInTheDocument();
});

test("loads the new project and ignores an old request after navigation", async () => {
  let finishOldRequest: (value: unknown) => void = () => {};
  (getRecordGroups as jest.Mock)
    .mockImplementationOnce(() => new Promise(resolve => { finishOldRequest = resolve; }))
    .mockResolvedValueOnce(project("second"));
  renderProject();
  fireEvent.click(screen.getByRole("link", { name: "Next project" }));
  await screen.findByText("Group second");
  await act(async () => finishOldRequest(response({ detail: "Old project error" }, 409)));
  expect(screen.getByText("Group second")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(getRecordGroups).toHaveBeenLastCalledWith("second");
});
