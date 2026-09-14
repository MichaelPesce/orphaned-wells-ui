import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UploadJobDetails from "../components/UploadHistory/UploadJobDetails";
import { useProcessingQuery } from "../components/UploadHistory/useProcessingQuery";
import { getProcessingJobDetails, getProcessingJobHistory, retryProcessingJob } from "../services/app.service";

jest.mock("../services/app.service", () => ({getProcessingJobDetails: jest.fn(), getProcessingJobHistory: jest.fn(), retryProcessingJob: jest.fn()}));
jest.mock("../usercontext", () => ({useUserContext: () => ({hasPermission: () => true})}));
const response = (body: unknown) => ({status: 200, json: async () => body});
const job = {job_id: "job", status: "error", created_at: 100, input: {upload_session_id: "job"}, request_user: {email: "user"}, summary: {total_succeeded: 0, total_failed: 1, total_skipped_duplicates: 0}};

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.useRealTimers());

test("history refresh preserves rows, serializes requests, and stops when no active jobs remain", async () => {
  jest.useFakeTimers();
  let resolveRefresh: (result: unknown) => void = () => {};
  (getProcessingJobHistory as jest.Mock).mockResolvedValueOnce(response({active_count: 1, jobs: ["saved"]}))
    .mockImplementationOnce(() => new Promise((resolve) => {resolveRefresh = resolve;}));
  const {result, unmount} = renderHook(() => useProcessingQuery<{active_count: number; jobs: string[]}>(getProcessingJobHistory, ["group", {}], (data) => data.active_count > 0));
  await waitFor(() => expect(result.current.data?.jobs).toEqual(["saved"]));
  await act(async () => {jest.advanceTimersByTime(5000);});
  expect(result.current.loading).toBe(false);
  expect(result.current.data?.jobs).toEqual(["saved"]);
  await act(async () => {jest.advanceTimersByTime(20000);});
  expect(getProcessingJobHistory).toHaveBeenCalledTimes(2);
  await act(async () => {resolveRefresh(response({active_count: 0, jobs: ["finished"]}));});
  await act(async () => {jest.advanceTimersByTime(20000);});
  expect(getProcessingJobHistory).toHaveBeenCalledTimes(2);
  unmount();
});

test("ignores a response from a previous group and retains data on refresh failure", async () => {
  let finishOld: (result: unknown) => void = () => {};
  (getProcessingJobHistory as jest.Mock).mockImplementationOnce(() => new Promise((resolve) => {finishOld = resolve;}))
    .mockResolvedValueOnce(response({active_count: 0, jobs: ["new group"]}))
    .mockResolvedValueOnce({status: 403, json: async () => ({detail: "Access denied"})});
  const {result, rerender} = renderHook(({id}) => useProcessingQuery<{active_count: number; jobs: string[]}>(getProcessingJobHistory, [id, {}], (data) => data.active_count > 0), {initialProps: {id: "old"}});
  rerender({id: "new"});
  await waitFor(() => expect(result.current.data?.jobs).toEqual(["new group"]));
  await act(async () => {finishOld(response({active_count: 0, jobs: ["old group"]}));});
  expect(result.current.data?.jobs).toEqual(["new group"]);
  act(() => result.current.refresh());
  await waitFor(() => expect(result.current.error).toBe("Access denied"));
  expect(result.current.data?.jobs).toEqual(["new group"]);
});

test("details show why retry is unavailable and load file pages on demand", async () => {
  (getProcessingJobDetails as jest.Mock).mockResolvedValue(response({job, retry: {allowed: false, reason: "The upload has expired."}, files: [{name: "Well", record_id: "record"}], file_count: 30}));
  render(<MemoryRouter><UploadJobDetails recordGroupId="group" jobId="job" onClose={jest.fn()} onRetry={jest.fn()} /></MemoryRouter>);
  expect(await screen.findByText("The upload has expired.")).toBeInTheDocument();
  expect(screen.getByRole("button", {name: "Retry failed processing"})).toBeDisabled();
  expect(screen.getByRole("link", {name: "Well"})).toHaveAttribute("href", "/record/record");
  fireEvent.click(screen.getByRole("button", {name: "Go to next page"}));
  await waitFor(() => expect(getProcessingJobDetails).toHaveBeenLastCalledWith("group", "job", "records", 1));
  await screen.findByText("The upload has expired.");
  expect(retryProcessingJob).not.toHaveBeenCalled();
});
