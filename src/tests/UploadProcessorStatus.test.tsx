import { act, fireEvent, render, screen } from "@testing-library/react";
import UploadProcessorStatus from "../components/UploadDocumentsModal/UploadProcessorStatus";
import { checkProcessorStatus, deployProcessor, undeployProcessor } from "../services/app.service";

jest.mock("../services/app.service", () => ({
  checkProcessorStatus: jest.fn(), deployProcessor: jest.fn(), undeployProcessor: jest.fn(),
}));
const response = (body: unknown, status = 200) => ({status, json: async () => body});
const flush = async () => {await act(async () => {await Promise.resolve();});};
const tick = async (milliseconds = 5000) => {await act(async () => {jest.advanceTimersByTime(milliseconds);});};
const onReady = jest.fn();
const statusView = (recordGroupId = "group") => <UploadProcessorStatus recordGroupId={recordGroupId} busy={false} permitted onReady={onReady} />;
const deploy = () => {
  fireEvent.click(screen.getByRole("button", {name: "Processor undeployed"}));
  fireEvent.click(screen.getByRole("menuitem", {name: "Deploy processor"}));
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  (checkProcessorStatus as jest.Mock).mockResolvedValue(response(3));
  (deployProcessor as jest.Mock).mockResolvedValue(response(2));
});
afterEach(() => {jest.clearAllTimers(); jest.useRealTimers();});

test.each([10, 0, 7, null])("status %s shows an unavailable state instead of polling forever", async (state) => {
  (checkProcessorStatus as jest.Mock).mockResolvedValue(response(state));
  render(statusView());
  await flush();
  expect(screen.queryByText("Checking processor")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {name: "Processor unavailable"}));
  expect(screen.getByRole("menuitem", {name: "Retry status check"})).toBeEnabled();
  expect(screen.queryByRole("menuitem", {name: "Deploy processor"})).not.toBeInTheDocument();
  await tick(60000);
  expect(checkProcessorStatus).toHaveBeenCalledTimes(1);
  expect(onReady).toHaveBeenLastCalledWith(false);
});

test("a missing processor can be checked again without refreshing", async () => {
  (checkProcessorStatus as jest.Mock).mockResolvedValueOnce(response({detail: "Not found"}, 404)).mockResolvedValue(response(3));
  render(statusView());
  await flush();
  fireEvent.click(screen.getByRole("button", {name: "Processor unavailable"}));
  expect(screen.getByText(/Processor not found\. Check/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("menuitem", {name: "Retry status check"}));
  await flush();
  expect(screen.getByText("Processor undeployed")).toBeInTheDocument();
  expect(checkProcessorStatus).toHaveBeenCalledTimes(2);
});

test("deployment feedback is immediate and survives stale status until completion", async () => {
  let acknowledge!: (value: unknown) => void;
  (deployProcessor as jest.Mock).mockReturnValue(new Promise((resolve) => {acknowledge = resolve;}));
  (checkProcessorStatus as jest.Mock)
    .mockResolvedValueOnce(response(3))
    .mockResolvedValueOnce(response(3))
    .mockResolvedValueOnce(response(2))
    .mockResolvedValueOnce(response(1));
  render(statusView());
  await flush();
  deploy();
  expect(screen.getByRole("button", {name: "Processor deploying", hidden: true})).toBeDisabled();
  expect(onReady).toHaveBeenLastCalledWith(false);
  await act(async () => {acknowledge(response(2));});
  for (let poll = 0; poll < 2; poll++) {
    await tick();
    expect(screen.getByRole("button", {name: "Processor deploying"})).toBeDisabled();
    expect(screen.queryByRole("menuitem", {name: "Deploy processor"})).not.toBeInTheDocument();
  }
  await tick();
  expect(screen.getByRole("button", {name: "Processor deployed"})).toBeEnabled();
  expect(onReady).toHaveBeenLastCalledWith(true);
  expect(deployProcessor).toHaveBeenCalledTimes(1);
  await tick();
  expect(checkProcessorStatus).toHaveBeenCalledTimes(4);
});

test("an already-deploying processor is polled without offering deployment again", async () => {
  (checkProcessorStatus as jest.Mock).mockResolvedValueOnce(response(2)).mockResolvedValue(response(1));
  render(statusView());
  await flush();
  expect(screen.getByRole("button", {name: "Processor deploying"})).toBeDisabled();
  await tick();
  expect(screen.getByRole("button", {name: "Processor deployed"})).toBeEnabled();
  expect(deployProcessor).not.toHaveBeenCalled();
});

test("an unsuccessful deploy request exposes an error and status retry", async () => {
  (deployProcessor as jest.Mock).mockRejectedValue(new Error("Network unavailable"));
  render(statusView());
  await flush();
  deploy();
  await flush();
  await tick(300);
  fireEvent.click(screen.getByRole("button", {name: "Processor unavailable"}));
  expect(screen.getByText(/Unable to change processor deployment/)).toBeInTheDocument();
  expect(screen.getByRole("menuitem", {name: "Retry status check"})).toBeEnabled();
  expect(onReady).toHaveBeenLastCalledWith(false);
});

test("an accepted request that never starts eventually offers a status retry", async () => {
  render(statusView());
  await flush();
  deploy();
  await flush();
  await tick(60000);
  expect(screen.getByRole("button", {name: "Processor unavailable"})).toBeEnabled();
  expect(onReady).toHaveBeenLastCalledWith(false);
});

test("undeployment also shows its transition while the request is pending", async () => {
  let acknowledge!: (value: unknown) => void;
  (checkProcessorStatus as jest.Mock).mockResolvedValue(response(1));
  (undeployProcessor as jest.Mock).mockReturnValue(new Promise((resolve) => {acknowledge = resolve;}));
  render(statusView());
  await flush();
  fireEvent.click(screen.getByRole("button", {name: "Processor deployed"}));
  fireEvent.click(screen.getByRole("menuitem", {name: "Undeploy processor"}));
  expect(screen.getByRole("button", {name: "Processor undeploying", hidden: true})).toBeDisabled();
  expect(onReady).toHaveBeenLastCalledWith(false);
  await act(async () => {acknowledge(response(3));});
  expect(screen.getByText("Processor undeployed")).toBeInTheDocument();
});

test("late responses from another record group cannot change readiness", async () => {
  let oldStatus!: (value: unknown) => void;
  (checkProcessorStatus as jest.Mock).mockReturnValueOnce(new Promise((resolve) => {oldStatus = resolve;})).mockResolvedValue(response(1));
  const {rerender} = render(statusView("old-group"));
  rerender(statusView("new-group"));
  await flush();
  expect(screen.getByRole("button", {name: "Processor deployed"})).toBeEnabled();
  await act(async () => {oldStatus(response(3));});
  expect(screen.getByRole("button", {name: "Processor deployed"})).toBeEnabled();
  expect(onReady).toHaveBeenLastCalledWith(true);
});
