import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecordsTable from "../components/RecordsTable/RecordsTable";
import { useRecordsTableData } from "../components/RecordsTable/useRecordsTableData";

jest.mock("../components/RecordsTable/useRecordsTableData", () => ({ useRecordsTableData: jest.fn() }));

test("shows the record load error with a working retry action", () => {
  const retry = jest.fn();
  (useRecordsTableData as jest.Mock).mockReturnValue({
    records: [], setRecords: jest.fn(), recordCount: 0, loading: false,
    error: "The schema changed. Reload and retry.", retry,
  });
  render(<MemoryRouter>
    <RecordsTable location="project" params={{ id: "project" }} handleUpdate={jest.fn()} />
  </MemoryRouter>);
  expect(screen.getByRole("alert")).toHaveTextContent("The schema changed. Reload and retry.");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
