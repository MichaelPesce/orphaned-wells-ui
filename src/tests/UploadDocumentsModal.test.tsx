import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UploadDocumentsModal from "../components/UploadDocumentsModal/UploadDocumentsModal";
import { checkForDuplicateRecords, checkProcessorStatus, getDirectoryUploadConfig } from "../services/app.service";

jest.mock("../services/app.service", () => ({checkForDuplicateRecords: jest.fn(), checkProcessorStatus: jest.fn(), getDirectoryUploadConfig: jest.fn()}));
jest.mock("../usercontext", () => ({useUserContext: () => ({hasPermission: () => true, userEmail: "user"})}));
const response = (body: unknown) => ({status: 200, json: async () => body});

beforeEach(() => {
  jest.clearAllMocks();
  (checkProcessorStatus as jest.Mock).mockResolvedValue(response(1));
  (checkForDuplicateRecords as jest.Mock).mockResolvedValue(response([]));
  (getDirectoryUploadConfig as jest.Mock).mockResolvedValue(response({mode: "direct", max_files: 1000, max_file_bytes: 10000, max_total_bytes: 1000000}));
});

test("history link is present immediately and selected files occupy a fixed region", async () => {
  const {container} = render(<MemoryRouter initialEntries={["/record_group/group"]}><Routes><Route path="record_group/:id" element={<UploadDocumentsModal setShowModal={jest.fn()} handleUploadDocument={jest.fn()} />} /></Routes></MemoryRouter>);
  expect(screen.getByRole("link", {name: "Upload history"})).toHaveAttribute("href", "/record_group/group/uploads");
  await waitFor(() => expect(screen.getByRole("tab", {name: "Local directory"})).toBeEnabled());
  const files = Array.from({length: 500}, (_, index) => new File(["pdf"], `well-${index}.pdf`, {type: "application/pdf"}));
  fireEvent.change(screen.getByLabelText("Select local directory files"), {target: {files}});
  await waitFor(() => expect(screen.getByRole("button", {name: "Upload"})).toBeEnabled());
  const region = screen.getByLabelText("Selected files");
  expect(region).toHaveStyle({height: "240px"});
  fireEvent.change(screen.getByRole("spinbutton", {name: "Upload amount"}), {target: {value: "1"}});
  expect(region).toHaveStyle({height: "240px"});
  expect(screen.queryByText("well-499.pdf")).not.toBeInTheDocument();
  expect(screen.queryByText("Recent processing jobs")).not.toBeInTheDocument();
  expect(container).toBeInTheDocument();
});
