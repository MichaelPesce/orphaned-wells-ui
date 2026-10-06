import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ColumnSelectDialog from "../components/ColumnSelectDialog/ColumnSelectDialog";
import { DownloadProvider } from "../context/DownloadContext";
import { downloadRecords, getColumnData } from "../services/app.service";

jest.mock("../services/app.service", () => ({
  downloadRecords: jest.fn(),
  getColumnData: jest.fn(),
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

test("shows reconstruct original document checkbox only when location is project and collaborator is rrc", async () => {
  const originalCollaborator = process.env.REACT_APP_COLLABORATOR;
  process.env.REACT_APP_COLLABORATOR = "rrc";
  const onClose = jest.fn();
  (getColumnData as jest.Mock).mockResolvedValue({
    status: 200,
    json: async () => ({ columns: ["record_notes"], obj: { name: "Test Project" } }),
  });

  try {
    const { rerender } = render(
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

    // Checkbox should NOT be present for location="record_group"
    expect(screen.queryByLabelText("Reconstruct original document page order")).not.toBeInTheDocument();

    // Rerender with location="project"
    rerender(
      <DownloadProvider>
        <ColumnSelectDialog
          open
          onClose={onClose}
          location="project"
          handleUpdate={jest.fn()}
          _id="project123"
          appliedFilters={[]}
          sortBy="dateCreated"
          sortAscending={1}
        />
      </DownloadProvider>
    );

    // Checkbox SHOULD be present for location="project" and collaborator="rrc"
    const checkbox = await screen.findByLabelText("Reconstruct original document page order");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Check the checkbox
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

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

      // Verify reconstruct_original_doc: true was passed in body (5th arg of downloadRecords)
      const callArgs = (downloadRecords as jest.Mock).mock.calls[(downloadRecords as jest.Mock).mock.calls.length - 1];
      expect(callArgs[0]).toBe("project");
      expect(callArgs[4].reconstruct_original_doc).toBe(true);
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      click.mockRestore();
    }
  } finally {
    process.env.REACT_APP_COLLABORATOR = originalCollaborator;
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
