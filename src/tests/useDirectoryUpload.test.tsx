import { act, renderHook } from "@testing-library/react";
import { useDirectoryUpload } from "../components/UploadDocumentsModal/useDirectoryUpload";
import { requestUploadApi } from "../components/UploadDocumentsModal/uploadApi";
import { createDirectoryUpload, createDirectoryFileUpload, finalizeDirectoryUpload, uploadDocument } from "../services/app.service";
import { uploadFileToGcs } from "../services/gcsUpload.service";

jest.mock("../components/UploadDocumentsModal/uploadApi", () => ({
  filePath: (file: File) => file.webkitRelativePath || file.name,
  requestUploadApi: jest.fn(),
}));
jest.mock("../services/gcsUpload.service", () => ({
  ...jest.requireActual("../services/gcsUpload.service"), uploadFileToGcs: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  Object.defineProperty(global, "crypto", {configurable: true, value: {randomUUID: () => "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}});
});

test("sends only metadata to the API and finalizes after every file is transferred", async () => {
  const completed: string[] = [];
  let sentFiles: unknown;
  let completedBeforeFinalization: string[] = [];
  (requestUploadApi as jest.Mock).mockImplementation(async (api, args) => {
    if (api === createDirectoryUpload) {
      sentFiles = args[1].files;
      return {session_id: "b".repeat(32), files: [{file_id: "0"}]};
    }
    if (api === createDirectoryFileUpload) return {uploaded: false, upload_url: "https://storage.googleapis.com/session"};
    if (api === finalizeDirectoryUpload) { completedBeforeFinalization = [...completed]; return {job_id: "job", status: "queued"}; }
    if (api === uploadDocument) throw new Error("Directory bytes reached the API");
    throw new Error("Unexpected request");
  });
  (uploadFileToGcs as jest.Mock).mockImplementation(async (_, file) => { completed.push(file.name); });
  const setUploading = jest.fn();
  const {result} = renderHook(() => useDirectoryUpload("group", "user", setUploading));
  await act(async () => { await result.current.start([new File(["pdf"], "well.pdf")], "direct", true, true); });
  expect(result.current.finished).toBe(true);
  expect(sentFiles).toEqual([{name: "well.pdf", relative_path: "well.pdf", size: 3}]);
  expect(completedBeforeFinalization).toEqual(["well.pdf"]);
  expect(result.current.job?.job_id).toBe("job");
  expect(setUploading).toHaveBeenLastCalledWith(false);
});

test("a failed transfer does not finalize and retry reuses the same upload session", async () => {
  const sessionIds: string[] = [];
  let finalized = 0;
  (requestUploadApi as jest.Mock).mockImplementation(async (api, args) => {
    if (api === createDirectoryUpload) { sessionIds.push(args[1].session_id); return {session_id: args[1].session_id, files: [{file_id: "0"}]}; }
    if (api === createDirectoryFileUpload) return {uploaded: false, upload_url: "https://storage.googleapis.com/session"};
    if (api === finalizeDirectoryUpload) { finalized++; return {job_id: "job"}; }
  });
  (uploadFileToGcs as jest.Mock).mockRejectedValueOnce(new Error("network failure")).mockResolvedValueOnce(undefined);
  const setUploading = jest.fn();
  const {result} = renderHook(() => useDirectoryUpload("group", "user", setUploading));
  const files = [new File(["pdf"], "well.pdf")];
  await act(async () => { await result.current.start(files, "direct", true, true); });
  expect(finalized).toBe(0);
  expect(result.current.fileErrors).toEqual(["well.pdf"]);
  await act(async () => { await result.current.start(files, "direct", true, true); });
  expect(finalized).toBe(1);
  expect(sessionIds[0]).toBe(sessionIds[1]);
  expect(result.current.finished).toBe(true);
});
