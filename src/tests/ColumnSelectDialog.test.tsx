import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ColumnSelectDialog from "../components/ColumnSelectDialog/ColumnSelectDialog";
import { DownloadProvider } from "../context/DownloadContext";
import { downloadRecords, getColumnData } from "../services/app.service";

jest.mock("../services/app.service", () => ({
  downloadRecords: jest.fn(),
  getColumnData: jest.fn(),
}));

jest.mock("../usercontext", () => ({
  useUserContext: () => ({
    user: { collaborator: "rrc" },
    hasPermission: () => true,
  }),
}));

test("shows an export failure, permits retry, and closes only after a successful download", async () => {
  const onClose = jest.fn();
  (getColumnData as jest.Mock).mockResolvedValue({
    status: 200,
    json: async () => ({ columns: ["record_notes"], obj: { name: "Test group" } }),
  });
  (downloadRecords as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

  render(
    <DownloadProvider>
      <ColumnSelectDialog
        open
        onClose={onClose}
        location="record_group"
        handleUpdate={jest.fn()}
        _id="group"
        appliedFilters={[]}
        sortBy="dateCreated"
        sortAscending={1}
      />
    </DownloadProvider>
  );

  const exportButton = screen.getByRole("button", { name: "Export Data" });
  await waitFor(() => expect(exportButton).toBeEnabled());
  fireEvent.click(exportButton);

  expect(await screen.findByRole("alert")).toHaveTextContent("unable to export: Download failed with status 500");
  expect(onClose).not.toHaveBeenCalled();
  expect(exportButton).toBeEnabled();

  const read = jest.fn()
    .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
    .mockResolvedValueOnce({ done: true });
  (downloadRecords as jest.Mock).mockResolvedValueOnce({
    ok: true,
    body: { getReader: () => ({ read }) },
  });
  const originalCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = jest.fn(() => "blob:test-export");
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  try {
    fireEvent.click(exportButton);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(click).toHaveBeenCalledTimes(1);
    expect(downloadRecords).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
    click.mockRestore();
  }
});


test("shows export raw OCR read values checkbox and passes export_raw_values flag when checked", async () => {
  const onClose = jest.fn();
  (getColumnData as jest.Mock).mockResolvedValue({
    status: 200,
    json: async () => ({ columns: ["record_notes"], obj: { name: "Test Group" } }),
  });

  render(
    <DownloadProvider>
      <ColumnSelectDialog
        open
        onClose={onClose}
        location="record_group"
        handleUpdate={jest.fn()}
        _id="rg123"
        appliedFilters={[]}
        sortBy="dateCreated"
        sortAscending={1}
      />
    </DownloadProvider>
  );

  const rawCheckbox = await screen.findByLabelText("Export raw OCR read values for all fields");
  expect(rawCheckbox).toBeInTheDocument();
  expect(rawCheckbox).not.toBeChecked();

  fireEvent.click(rawCheckbox);
  expect(rawCheckbox).toBeChecked();

  const read = jest.fn()
    .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
    .mockResolvedValueOnce({ done: true });
  (downloadRecords as jest.Mock).mockResolvedValueOnce({
    ok: true,
    body: { getReader: () => ({ read }) },
  });

  const exportButton = screen.getByRole("button", { name: "Export Data" });
  await waitFor(() => expect(exportButton).toBeEnabled());
  const originalCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = jest.fn(() => "blob:test-export");
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  try {
    fireEvent.click(exportButton);
    await waitFor(() => expect(downloadRecords).toHaveBeenCalled());

    const callArgs = (downloadRecords as jest.Mock).mock.calls[(downloadRecords as jest.Mock).mock.calls.length - 1];
    expect(callArgs[4].export_raw_values).toBe(true);
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
    click.mockRestore();
  }
});
