import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UploadGcsDirectory from "../components/UploadDocumentsModal/UploadGcsDirectory";
import { batchProcessDocuments, checkGcsBucketPath } from "../services/app.service";

jest.mock("../services/app.service", () => ({batchProcessDocuments: jest.fn(), checkGcsBucketPath: jest.fn()}));
jest.mock("../components/UploadDocumentsModal/CurrentUploadStatus", () => () => <div>Job submitted</div>);
const response = (body: unknown) => ({status: 200, json: async () => body});
const summary = {bucketName: "test-bucket", normalizedPrefix: "folder/", totalFiles: 3, totalBatches: 1, duplicateCount: 1, totalFilesToSubmit: 2, totalBatchesToSubmit: 1};
const Form = ({processorReady = true}: {processorReady?: boolean}) => {
  const [clean, setClean] = useState(true);
  const [uploading, setUploading] = useState(false);
  return <UploadGcsDirectory runCleaningFunctions={clean} setRunCleaningFunctions={setClean} uploading={uploading} setUploading={setUploading} processorReady={processorReady} />;
};
const open = (processorReady = true) => {
  render(<MemoryRouter initialEntries={["/record_group/group"]}><Routes><Route path="record_group/:id" element={<Form processorReady={processorReady} />} /></Routes></MemoryRouter>);
  fireEvent.change(screen.getByRole("textbox", {name: "Bucket name"}), {target: {value: "test-bucket"}});
  fireEvent.change(screen.getByRole("textbox", {name: "Prefix or folder path"}), {target: {value: "folder/"}});
};
const check = async () => {
  fireEvent.click(screen.getByRole("button", {name: "Check path"}));
  await act(async () => {await Promise.resolve();});
};
const start = () => screen.getByRole("button", {name: "Start processing"});

beforeEach(() => {
  jest.resetAllMocks();
  (checkGcsBucketPath as jest.Mock).mockResolvedValue(response(summary));
  (batchProcessDocuments as jest.Mock).mockResolvedValue(response({job_id: "job"}));
});

test("submission requires a completed positive path check", async () => {
  let finishCheck!: (value: unknown) => void;
  (checkGcsBucketPath as jest.Mock).mockReturnValue(new Promise((resolve) => {finishCheck = resolve;}));
  open();
  expect(start()).toBeDisabled();
  fireEvent.click(start());
  expect(batchProcessDocuments).not.toHaveBeenCalled();
  await check();
  expect(start()).toBeDisabled();
  expect(screen.getByText("Checking bucket and path…")).toBeInTheDocument();
  await act(async () => {finishCheck(response(summary));});
  expect(start()).toBeEnabled();
  fireEvent.click(start());
  expect(await screen.findByText("Job submitted")).toBeInTheDocument();
  expect(batchProcessDocuments).toHaveBeenCalledWith("group", {bucketName: "test-bucket", prefix: "folder/", preventDuplicates: true, runCleaningFunctions: true});
});

test.each([
  {totalFiles: 0, duplicateCount: 0},
  {totalFiles: 3, duplicateCount: 3},
])("cannot submit when the check finds no uploadable files: %j", async (counts) => {
  (checkGcsBucketPath as jest.Mock).mockResolvedValue(response({...summary, ...counts, totalFilesToSubmit: 0, totalBatchesToSubmit: 0}));
  open();
  await check();
  expect(start()).toBeDisabled();
  fireEvent.click(start());
  expect(batchProcessDocuments).not.toHaveBeenCalled();
  expect(screen.getByText(/0 files to submit/)).toBeInTheDocument();
});

test.each(["Bucket name", "Prefix or folder path", "Prevent Duplicates"])("changing %s requires another check, even if restored", async (field) => {
  open();
  await check();
  expect(start()).toBeEnabled();
  const input = screen.getByRole(field === "Prevent Duplicates" ? "checkbox" : "textbox", {name: field});
  const original = (input as HTMLInputElement).value;
  const change = (value: string) => field === "Prevent Duplicates" ? fireEvent.click(input) : fireEvent.change(input, {target: {value}});
  change("changed");
  expect(start()).toBeDisabled();
  change(original);
  expect(start()).toBeDisabled();
  expect(screen.queryByText(/supported files found/)).not.toBeInTheDocument();
  expect(checkGcsBucketPath).toHaveBeenCalledTimes(1);
  await check();
  expect(start()).toBeEnabled();
  expect(checkGcsBucketPath).toHaveBeenCalledTimes(2);
});

test("changing cleaning preserves the check and submits the new cleaning option", async () => {
  open();
  await check();
  fireEvent.click(screen.getByRole("checkbox", {name: "Run cleaning functions"}));
  expect(start()).toBeEnabled();
  expect(checkGcsBucketPath).toHaveBeenCalledTimes(1);
  fireEvent.click(start());
  expect(await screen.findByText("Job submitted")).toBeInTheDocument();
  expect(batchProcessDocuments).toHaveBeenCalledWith("group", expect.objectContaining({runCleaningFunctions: false}));
});

test("a failed recheck clears a previously successful check", async () => {
  open();
  await check();
  expect(start()).toBeEnabled();
  (checkGcsBucketPath as jest.Mock).mockRejectedValue(new Error("Network error"));
  await check();
  expect(start()).toBeDisabled();
  expect(screen.getByText("Unable to check Google Cloud Storage bucket/path.")).toBeInTheDocument();
});

test("a positive path check does not bypass processor readiness", async () => {
  open(false);
  await check();
  expect(start()).toBeDisabled();
  expect(batchProcessDocuments).not.toHaveBeenCalled();
});
