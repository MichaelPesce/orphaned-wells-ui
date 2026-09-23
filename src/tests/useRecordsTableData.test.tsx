import { act, renderHook, waitFor } from "@testing-library/react";
import { useRecordsTableData } from "../components/RecordsTable/useRecordsTableData";
import { getRecords } from "../services/app.service";
import { RecordData, RecordsResponse } from "../types";

jest.mock("../services/app.service", () => ({getRecords: jest.fn()}));

const query = {
  location: "record_group", scopeId: "group", currentPage: 3, pageSize: 25,
  filters: [], sort: ["dateCreated", -1] as [string, number],
};
const row = (status: string, id = "record") => ({_id: id, name: "Well", status} as RecordData);
const response = (records: RecordData[], active = false) => ({
  status: 200,
  json: async (): Promise<RecordsResponse> => ({records, record_count: records.length, has_active_processing_jobs: active}),
});

beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); });
afterEach(() => { jest.useRealTimers(); });

test("polls while jobs are active, preserves rows during refresh, and stops after completion", async () => {
  let resolveRefresh: (value: unknown) => void = () => {};
  (getRecords as jest.Mock).mockResolvedValueOnce(response([row("queued")], true))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));
  const {result} = renderHook(() => useRecordsTableData(query));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.records[0].status).toBe("queued");
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(result.current.loading).toBe(false);
  expect(result.current.records[0].status).toBe("queued");
  await act(async () => { jest.advanceTimersByTime(20000); });
  expect(getRecords).toHaveBeenCalledTimes(2);
  await act(async () => { resolveRefresh(response([row("digitized")])); });
  expect(result.current.records[0].status).toBe("digitized");
  await act(async () => { jest.advanceTimersByTime(20000); });
  expect(getRecords).toHaveBeenCalledTimes(2);
  expect(getRecords).toHaveBeenLastCalledWith("record_group", {id: "group", sort: ["dateCreated", -1], filter: {}}, 3, 25);
});

test("polls for jobs outside the current table page and ignores stale responses after navigation", async () => {
  let finishOldRequest: (value: unknown) => void = () => {};
  (getRecords as jest.Mock).mockResolvedValueOnce(response([], true))
    .mockImplementationOnce(() => new Promise((resolve) => { finishOldRequest = resolve; }))
    .mockResolvedValueOnce(response([row("digitized", "new-group-record")]));
  const {result, rerender} = renderHook(({scopeId}) => useRecordsTableData({...query, scopeId}), {initialProps: {scopeId: "group"}});
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => { jest.advanceTimersByTime(5000); });
  rerender({scopeId: "another-group"});
  await waitFor(() => expect(result.current.records[0]?._id).toBe("new-group-record"));
  await act(async () => { finishOldRequest(response([row("queued", "old-group-record")], true)); });
  expect(result.current.records[0]._id).toBe("new-group-record");
});

test("keeps the last rows through a transient failure and recovers on the next poll", async () => {
  (getRecords as jest.Mock).mockResolvedValueOnce(response([row("processing")], true))
    .mockRejectedValueOnce(new Error("Connection lost"))
    .mockResolvedValueOnce(response([row("digitized")]));
  const {result, unmount} = renderHook(() => useRecordsTableData(query));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(result.current.error).toBe("Connection lost. Retrying shortly.");
  expect(result.current.records[0].status).toBe("processing");
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(result.current.error).toBe("");
  expect(result.current.records[0].status).toBe("digitized");
  unmount();
  await act(async () => { jest.advanceTimersByTime(20000); });
  expect(getRecords).toHaveBeenCalledTimes(3);
});

test("discovers submissions while the dialog is open and keeps polling after it closes", async () => {
  (getRecords as jest.Mock).mockResolvedValueOnce(response([]))
    .mockResolvedValueOnce(response([row("queued")], true))
    .mockResolvedValue(response([row("queued", "submitted-record")], true));
  const {result, rerender} = renderHook(({open}) => useRecordsTableData({...query, refreshKey: Number(open), pollWhileIdle: open}), {initialProps: {open: true}});
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(result.current.records[0].status).toBe("queued");
  rerender({open: false});
  await waitFor(() => expect(result.current.records[0]?._id).toBe("submitted-record"));
  const callsAtClose = (getRecords as jest.Mock).mock.calls.length;
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(getRecords).toHaveBeenCalledTimes(callsAtClose + 1);
});

test("shows backend error details without repeatedly retrying a rejected request", async () => {
  (getRecords as jest.Mock)
    .mockResolvedValueOnce({ status: 409, json: async () => ({ detail: "The schema changed. Reload and retry." }) })
    .mockResolvedValueOnce(response([row("digitized")]));
  const { result } = renderHook(() => useRecordsTableData(query));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe("The schema changed. Reload and retry.");
  await act(async () => { jest.advanceTimersByTime(20000); });
  expect(getRecords).toHaveBeenCalledTimes(1);
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.records).toHaveLength(1));
  expect(result.current.error).toBe("");
  expect(result.current.loading).toBe(false);
});

test("preserves the backend message while automatically retrying a temporary server failure", async () => {
  (getRecords as jest.Mock)
    .mockResolvedValueOnce({ status: 503, json: async () => ({ detail: "Database temporarily unavailable." }) })
    .mockResolvedValueOnce(response([row("digitized")]));
  const { result } = renderHook(() => useRecordsTableData(query));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe("Database temporarily unavailable. Retrying shortly.");
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(result.current.records).toHaveLength(1);
  expect(result.current.error).toBe("");
});
