import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  importRecordFileRecords,
  importRecordGroupFile,
  previewRecordFileRecords,
  previewRecordGroupFile,
} from "../../services/app.service";
import { callAPI } from "../../util";
import { JsonImportPreviewResponse, JsonImportResponse } from "../../types";
import FileDropzone from "../FileDropzone/FileDropzone";

interface JsonImportDialogProps {
  open: boolean;
  mode: "create_record_group" | "append_records";
  projectId?: string;
  recordGroupId?: string;
  onClose: () => void;
  onImported: (response: JsonImportResponse) => void;
  setErrorMsg: (msg: string) => void;
}

const getRecordsFromImportPackage = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const records = (data as { records?: unknown }).records;
    if (Array.isArray(records)) return records;
  }
  return [];
};

const getSchemaFieldCount = (data: unknown): number => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return 0;
  const importPackage = data as {
    schema?: { fields?: unknown; attributes?: unknown };
    schema_fields?: unknown;
  };
  const fields =
    importPackage.schema?.fields ||
    importPackage.schema?.attributes ||
    importPackage.schema_fields;
  return Array.isArray(fields) ? fields.length : 0;
};

const getDefaultRecordGroupName = (filename: string) => {
  const cleanName = filename.replace(/\.(json|csv)$/i, "").trim();
  return cleanName || "Record Import";
};

const getCsvRecordCount = (text: string) => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "").length - 1;
};

const JsonImportDialog = ({
  open,
  mode,
  projectId,
  recordGroupId,
  onClose,
  onImported,
  setErrorMsg,
}: JsonImportDialogProps) => {
  const [recordGroupName, setRecordGroupName] = useState("");
  const [recordGroupDescription, setRecordGroupDescription] = useState("");
  const [documentType, setDocumentType] = useState("JSON Import");
  const [files, setFiles] = useState<File[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [schemaFieldCount, setSchemaFieldCount] = useState(0);
  const [fileFormat, setFileFormat] = useState("");
  const [preview, setPreview] = useState<JsonImportPreviewResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const previewRequestIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setRecordGroupName("");
      setRecordGroupDescription("");
      setDocumentType("JSON Import");
      setFiles([]);
      setRecordCount(0);
      setSchemaFieldCount(0);
      setFileFormat("");
      setPreview(null);
      setPreviewing(false);
      setLocalError("");
      setSubmitting(false);
      setPreventDuplicates(true);
    }
  }, [open]);

  const isCreateMode = mode === "create_record_group";
  const file = files[0];
  const disableImport =
    submitting ||
    previewing ||
    !file ||
    recordCount <= 0 ||
    (isCreateMode && recordGroupName.trim() === "");

  const requestImportPreview = (
    previewFile: File,
    nextPreventDuplicates: boolean
  ) => {
    const targetId = isCreateMode ? projectId : recordGroupId;
    if (!targetId) return;

    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;

    const formData = new FormData();
    formData.append("file", previewFile);
    formData.append("preventDuplicates", String(nextPreventDuplicates));

    setPreview(null);
    setPreviewing(true);
    callAPI(
      isCreateMode ? previewRecordGroupFile : previewRecordFileRecords,
      [targetId, formData],
      (data: JsonImportPreviewResponse) => {
        if (requestId !== previewRequestIdRef.current) return;
        setPreviewing(false);
        setPreview(data);
        setRecordCount(data.record_count || data.requested_count || 0);
      },
      (error: string) => {
        if (requestId !== previewRequestIdRef.current) return;
        setPreviewing(false);
        setPreview(null);
        const message =
          typeof error === "string" ? error : "Unable to preview import file.";
        setLocalError(message);
      }
    );
  };

  const handleFilesSelected = async (nextFiles: File[]) => {
    const nextFile = nextFiles[0];
    if (!nextFile) return;

    setFiles([nextFile]);
    setRecordCount(0);
    setSchemaFieldCount(0);
    setFileFormat("");
    setPreview(null);
    setPreviewing(false);
    previewRequestIdRef.current += 1;
    setLocalError("");

    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    if (extension !== "json" && extension !== "csv") {
      setLocalError("Upload a JSON or CSV file.");
      return;
    }

    try {
      const text = await nextFile.text();
      if (extension === "csv") {
        const nextRecordCount = getCsvRecordCount(text);
        if (nextRecordCount <= 0) {
          setLocalError("CSV file must include a header row and at least one record.");
          return;
        }
        setRecordCount(nextRecordCount);
        setFileFormat("CSV");
      } else {
        const parsedJson = JSON.parse(text);
        const nextRecords = getRecordsFromImportPackage(parsedJson);
        if (nextRecords.length === 0) {
          setLocalError("JSON file must include at least one record.");
          return;
        }
        setRecordCount(nextRecords.length);
        setSchemaFieldCount(getSchemaFieldCount(parsedJson));
        setFileFormat("JSON");
      }

      if (isCreateMode && !recordGroupName.trim()) {
        setRecordGroupName(getDefaultRecordGroupName(nextFile.name));
      }
      requestImportPreview(nextFile, preventDuplicates);
    } catch (e) {
      setLocalError(`Unable to parse ${extension?.toUpperCase()} file.`);
    }
  };

  const handlePreventDuplicatesChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;
    setPreventDuplicates(checked);
    if (file && recordCount > 0) {
      requestImportPreview(file, checked);
    }
  };

  const handleImport = () => {
    if (!file) return;
    setSubmitting(true);
    setLocalError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("preventDuplicates", String(preventDuplicates));

    if (isCreateMode) {
      if (!projectId) {
        setSubmitting(false);
        setLocalError("Project ID is required.");
        return;
      }
      formData.append("record_group_name", recordGroupName.trim());
      formData.append("record_group_description", recordGroupDescription);
      formData.append("document_type", documentType.trim() || "JSON Import");
      callAPI(
        importRecordGroupFile,
        [projectId, formData],
        handleSuccessfulImport,
        handleFailedImport
      );
      return;
    }

    if (!recordGroupId) {
      setSubmitting(false);
      setLocalError("Record group ID is required.");
      return;
    }
    callAPI(
      importRecordFileRecords,
      [recordGroupId, formData],
      handleSuccessfulImport,
      handleFailedImport
    );
  };

  const handleSuccessfulImport = (response: JsonImportResponse) => {
    setSubmitting(false);
    onImported(response);
  };

  const handleFailedImport = (error: string) => {
    setSubmitting(false);
    const message = typeof error === "string" ? error : "Unable to import records.";
    setLocalError(message);
    setErrorMsg(message);
  };

  return (
    <Dialog
      data-cy="json-import-dialog"
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isCreateMode ? "Import Record Group" : "Import Records"}
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={submitting}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {isCreateMode && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  data-cy="json-import-record-group-name"
                  fullWidth
                  label="Record Group Name"
                  value={recordGroupName}
                  onChange={(event) => setRecordGroupName(event.target.value)}
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  data-cy="json-import-document-type"
                  fullWidth
                  label="Document Type"
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  data-cy="json-import-record-group-description"
                  fullWidth
                  label="Description"
                  value={recordGroupDescription}
                  onChange={(event) =>
                    setRecordGroupDescription(event.target.value)
                  }
                  multiline
                  rows={3}
                  disabled={submitting}
                />
              </Grid>
            </Grid>
          )}
          <FileDropzone
            dataCy="json-import-dropzone"
            files={files}
            onFilesSelected={handleFilesSelected}
            accept=".json,.csv,application/json,text/csv"
            title="Drop an export file here"
            subtitle="Import OGRRE JSON exports, OGRRE CSV exports, or OGRRE import packages."
            supportedText="Supported files: JSON or CSV"
            error={localError}
            disabled={submitting}
          />
          <FormControlLabel
            data-cy="json-import-prevent-duplicates"
            control={
              <Checkbox
                checked={preventDuplicates}
                onChange={handlePreventDuplicatesChange}
                disabled={submitting}
              />
            }
            label="Prevent Duplicates"
          />
          {file && recordCount > 0 && (
            <Alert
              severity={
                preventDuplicates &&
                preview &&
                preview.skipped_duplicate_count > 0
                  ? "warning"
                  : "info"
              }
              data-cy="json-import-preview"
            >
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {recordCount} record{recordCount === 1 ? "" : "s"} found
              </Typography>
              {fileFormat ? ` in ${fileFormat}.` : "."}
              {schemaFieldCount > 0
                ? ` ${schemaFieldCount} optional schema field${
                  schemaFieldCount === 1 ? "" : "s"
                } found.`
                : ""}
              {previewing ? " Checking duplicates..." : ""}
              {!previewing && preview && preventDuplicates && (
                preview.skipped_duplicate_count > 0
                  ? ` ${preview.skipped_duplicate_count} duplicate${
                    preview.skipped_duplicate_count === 1 ? "" : "s"
                  } will be skipped. ${preview.importable_count} record${
                    preview.importable_count === 1 ? "" : "s"
                  } will be imported.`
                  : " No duplicates found."
              )}
              {!previewing &&
                preview &&
                !preventDuplicates &&
                preview.existing_duplicate_count +
                  preview.internal_duplicate_count >
                  0 &&
                ` ${
                  preview.existing_duplicate_count +
                  preview.internal_duplicate_count
                } duplicate${
                  preview.existing_duplicate_count +
                    preview.internal_duplicate_count ===
                  1
                    ? ""
                    : "s"
                } found, but duplicate prevention is off.`}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          data-cy="json-import-submit"
          variant="contained"
          onClick={handleImport}
          disabled={disableImport}
        >
          {submitting ? "Importing..." : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JsonImportDialog;
