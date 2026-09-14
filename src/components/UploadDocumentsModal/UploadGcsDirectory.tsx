import { ChangeEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Button, DialogContent, FormControlLabel, LinearProgress, Stack, Switch, TextField, Typography } from "@mui/material";
import {
  batchProcessDocuments,
  checkGcsBucketPath,
} from "../../services/app.service";
import { callAPI } from "../../util";
import { useUserContext } from "../../usercontext";
import CurrentUploadStatus from "./CurrentUploadStatus";
import UploadFooter from "./UploadFooter";

interface UploadGcsDirectoryProps {
  runCleaningFunctions: boolean;
  setRunCleaningFunctions: (run: boolean) => void;
  uploading: boolean;
  onClose?: () => void;
  processorReady?: boolean;
  setUploading: (uploading: boolean) => void;
}

interface GcsPathCheckResult {
  bucketName: string;
  normalizedPrefix: string;
  totalFiles: number;
  totalBatches: number;
  totalLroWaves: number;
  duplicateFiles?: string[];
  duplicateCount?: number;
  nonDuplicateCount?: number;
  totalFilesToSubmit?: number;
  totalBatchesToSubmit?: number;
  totalLroWavesToSubmit?: number;
  preventDuplicates?: boolean;
}

const UploadGcsDirectory = (props: UploadGcsDirectoryProps) => {
  const params = useParams<{ id: string }>();
  const {hasPermission} = useUserContext();
  const {
    runCleaningFunctions,
    setRunCleaningFunctions,
    uploading,
    setUploading,
    onClose,
    processorReady = true,
  } = props;
  const [bucketName, setBucketName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [jobId, setJobId] = useState("");
  const [checkingPath, setCheckingPath] = useState(false);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [pathCheckResult, setPathCheckResult] =
    useState<GcsPathCheckResult | null>(null);

  const getRequestData = () => {
    const trimmedBucketName = bucketName.trim();
    const trimmedPrefix = prefix.trim().replace(/^\/+/, "");

    if (!trimmedBucketName) {
      setErrorMessage("Bucket name is required.");
      return null;
    }

    if (trimmedBucketName.startsWith("gs://") || trimmedBucketName.includes("/")) {
      setErrorMessage("Enter only the bucket name. Do not include gs:// or a folder path.");
      return null;
    }

    return {
      bucketName: trimmedBucketName,
      prefix: trimmedPrefix,
      runCleaningFunctions,
      preventDuplicates,
    };
  };

  const getFilesToSubmit = () => {
    if (!pathCheckResult) return 0;
    return pathCheckResult.totalFilesToSubmit ?? pathCheckResult.totalFiles;
  };

  const getBatchesToSubmit = () => {
    if (!pathCheckResult) return 0;
    return pathCheckResult.totalBatchesToSubmit ?? pathCheckResult.totalBatches;
  };

  const checkPath = () => {
    const requestData = getRequestData();
    if (!requestData) return;

    setErrorMessage("");
    setPathCheckResult(null);
    setCheckingPath(true);
    setUploading(true);

    callAPI(
      checkGcsBucketPath,
      [params.id, requestData],
      (response) => {
        setPathCheckResult(response);
        setCheckingPath(false);
        setUploading(false);
      },
      (error) => {
        setErrorMessage(
          typeof error === "string"
            ? error
            : "Unable to check Google Cloud Storage bucket/path."
        );
        setCheckingPath(false);
        setUploading(false);
      }
    );
  };

  const submit = () => {
    const requestData = getRequestData();
    if (!requestData) return;

    setErrorMessage("");
    setJobId("");
    setUploading(true);

    callAPI(
      batchProcessDocuments,
      [params.id, requestData],
      (response) => {
        setJobId(response.job_id);
        setUploading(false);
      },
      (error) => {
        setErrorMessage(
          typeof error === "string"
            ? error
            : "Unable to start Google Cloud Storage batch processing."
        );
        setUploading(false);
      }
    );
  };

  const handlePreventDuplicates = (e: any) => {
    setPreventDuplicates(e.target.checked);
    setPathCheckResult(null);
  };

  const handleBucketNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBucketName(e.target.value);
    setPathCheckResult(null);
    setJobId("");
  };

  const handlePrefixChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrefix(e.target.value);
    setPathCheckResult(null);
    setJobId("");
  };

  const disabled = uploading || checkingPath || !!jobId;
  const status = jobId ? <CurrentUploadStatus recordGroupId={params.id || ""} jobId={jobId} onClose={onClose} />
    : errorMessage ? <Alert severity="error">{errorMessage}</Alert>
      : checkingPath || uploading ? <Stack spacing={1}><Typography variant="body2">{checkingPath ? "Checking bucket and path…" : "Starting batch job…"}</Typography><LinearProgress /></Stack>
        : pathCheckResult ? <Alert severity={getFilesToSubmit() > 0 ? "info" : "warning"}>
          {pathCheckResult.totalFiles} supported files found · {pathCheckResult.duplicateCount || 0} duplicates · {getFilesToSubmit()} files to submit across {getBatchesToSubmit()} batches.
        </Alert>
          : <Typography variant="body2">Check the bucket and path to preview file and duplicate counts. Processing continues after submission.</Typography>;

  return <>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Typography variant="body2">Process supported documents already in Google Cloud Storage.</Typography>
        <TextField data-cy="gcs-bucket-input" fullWidth label="Bucket name" placeholder="my-upload-bucket"
          value={bucketName} onChange={handleBucketNameChange} disabled={disabled} helperText="Use only the bucket name. Do not include gs://." />
        <TextField data-cy="gcs-prefix-input" fullWidth label="Prefix or folder path" placeholder="incoming/well-records/"
          value={prefix} onChange={handlePrefixChange} disabled={disabled} helperText="Optional folder path. Trailing slash is optional." />
        <Stack direction="row" flexWrap="wrap">
          <FormControlLabel data-cy="gcs-prevent-duplicates-toggle" disabled={disabled} label="Prevent Duplicates"
            control={<Switch checked={preventDuplicates} onChange={handlePreventDuplicates} />} />
          <FormControlLabel data-cy="gcs-run-cleaning-toggle" disabled={disabled} label="Run cleaning functions"
            control={<Switch checked={runCleaningFunctions} onChange={(event) => setRunCleaningFunctions(event.target.checked)} />} />
        </Stack>
      </Stack>
    </DialogContent>
    <UploadFooter status={status} busy={uploading}>
      {jobId ? <Button onClick={onClose}>Close</Button> : <>
        <Button data-cy="gcs-check-path-button" variant="outlined" onClick={checkPath} disabled={disabled || !bucketName.trim() || !hasPermission("upload_document")}>Check path</Button>
        <Button data-cy="gcs-start-batch-button" variant="contained" onClick={submit}
          disabled={disabled || !processorReady || !hasPermission("upload_document") || !bucketName.trim() || (pathCheckResult !== null && getFilesToSubmit() === 0)}>Start processing</Button>
      </>}
    </UploadFooter>
  </>;
};

export default UploadGcsDirectory;
