import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { uploadRecordImages } from "../../services/app.service";
import { callAPI } from "../../util";
import { RecordImageUploadResponse } from "../../types";
import FileDropzone from "../FileDropzone/FileDropzone";

interface RecordImageUploadDialogProps {
  open: boolean;
  recordId?: string;
  onClose: () => void;
  onUploaded: (response: RecordImageUploadResponse) => void;
  setErrorMsg: (message: string) => void;
}

const allowedExtensions = ["png", "jpg", "jpeg", "tif", "tiff", "pdf"];

const RecordImageUploadDialog = ({
  open,
  recordId,
  onClose,
  onUploaded,
  setErrorMsg,
}: RecordImageUploadDialogProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setLocalError("");
      setSubmitting(false);
    }
  }, [open]);

  const handleFilesSelected = (nextFiles: File[]) => {
    const invalidFile = nextFiles.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      return !allowedExtensions.includes(extension);
    });
    if (invalidFile) {
      setFiles([]);
      setLocalError(`${invalidFile.name} is not a supported image file.`);
      return;
    }
    setFiles(nextFiles);
    setLocalError("");
  };

  const handleUpload = () => {
    if (!recordId || files.length === 0) return;
    setSubmitting(true);
    setLocalError("");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    callAPI(
      uploadRecordImages,
      [recordId, formData],
      (response) => {
        setSubmitting(false);
        onUploaded(response);
      },
      (error) => {
        setSubmitting(false);
        const message = typeof error === "string" ? error : "Unable to upload images.";
        setLocalError(message);
        setErrorMsg(message);
      }
    );
  };

  return (
    <Dialog
      data-cy="record-image-upload-dialog"
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Upload Record Images
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
          <FileDropzone
            dataCy="record-image-dropzone"
            files={files}
            onFilesSelected={handleFilesSelected}
            accept=".png,.jpg,.jpeg,.tif,.tiff,.pdf,image/png,image/jpeg,image/tiff,application/pdf"
            multiple
            title="Drop record images here"
            subtitle="Attach display images to this record."
            supportedText="Supported files: PNG, JPG, TIFF, or PDF"
            error={localError}
            disabled={submitting}
          />
          {files.length > 0 && (
            <Alert severity="info" data-cy="record-image-upload-preview">
              {files.length} file{files.length === 1 ? "" : "s"} ready to upload.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          data-cy="record-image-upload-submit"
          variant="contained"
          onClick={handleUpload}
          disabled={submitting || files.length === 0}
        >
          {submitting ? "Uploading..." : "Upload Images"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordImageUploadDialog;
