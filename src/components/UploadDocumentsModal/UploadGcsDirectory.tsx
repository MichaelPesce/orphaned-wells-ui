import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import {
  batchProcessDocuments,
  checkGcsBucketPath,
} from "../../services/app.service";
import { callAPI } from "../../util";

interface UploadGcsDirectoryProps {
  runCleaningFunctions: boolean;
  setRunCleaningFunctions: (run: boolean) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
}

interface GcsPathCheckResult {
  bucketName: string;
  normalizedPrefix: string;
  totalFiles: number;
  totalBatches: number;
  totalLroWaves: number;
}

const UploadGcsDirectory = (props: UploadGcsDirectoryProps) => {
  const params = useParams<{ id: string }>();
  const {
    runCleaningFunctions,
    setRunCleaningFunctions,
    uploading,
    setUploading,
  } = props;
  const [bucketName, setBucketName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [jobId, setJobId] = useState("");
  const [checkingPath, setCheckingPath] = useState(false);
  const [pathCheckResult, setPathCheckResult] =
    useState<GcsPathCheckResult | null>(null);

  const styles = {
    form: {
      marginTop: 2,
    },
    button: {
      borderRadius: "8px",
    },
    guidance: {
      color: "#616161",
      fontSize: "0.9rem",
      marginTop: 0,
    },
  };

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
    };
  };

  const checkPath = () => {
    const requestData = getRequestData();
    if (!requestData) return;

    setErrorMessage("");
    setPathCheckResult(null);
    setCheckingPath(true);

    callAPI(
      checkGcsBucketPath,
      [params.id, requestData],
      (response) => {
        setPathCheckResult(response);
        setCheckingPath(false);
      },
      (error) => {
        setErrorMessage(
          typeof error === "string"
            ? error
            : "Unable to check Google Cloud Storage bucket/path."
        );
        setCheckingPath(false);
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

  return (
    <Grid container spacing={2} sx={styles.form}>
      <Grid item xs={12}>
        <p style={styles.guidance}>
          Process every supported document in a Google Cloud Storage bucket or
          folder. The bucket name and prefix are entered separately.
        </p>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Bucket name"
          placeholder="my-upload-bucket"
          value={bucketName}
          onChange={(e) => {
            setBucketName(e.target.value);
            setPathCheckResult(null);
          }}
          disabled={uploading || checkingPath}
          helperText="Use only the bucket name. Do not include gs://."
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Prefix or folder path"
          placeholder="incoming/well-records/"
          value={prefix}
          onChange={(e) => {
            setPrefix(e.target.value);
            setPathCheckResult(null);
          }}
          disabled={uploading || checkingPath}
          helperText="Optional folder path. Trailing slash is optional."
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          disabled={uploading}
          control={<Switch />}
          label="Run cleaning functions"
          onChange={(e: any) => setRunCleaningFunctions(e.target.checked)}
          checked={runCleaningFunctions}
        />
      </Grid>
      {errorMessage && (
        <Grid item xs={12}>
          <Alert severity="error">{errorMessage}</Alert>
        </Grid>
      )}
      {jobId && (
        <Grid item xs={12}>
          <Alert severity="success">
            Batch processing started. Job ID: {jobId}
          </Alert>
        </Grid>
      )}
      {pathCheckResult && (
        <Grid item xs={12}>
          <Alert severity={pathCheckResult.totalFiles > 0 ? "info" : "warning"}>
            {pathCheckResult.totalFiles} supported file
            {pathCheckResult.totalFiles === 1 ? "" : "s"} will be submitted from{" "}
            gs://{pathCheckResult.bucketName}/
            {pathCheckResult.normalizedPrefix || ""}
            {pathCheckResult.totalBatches > 0 &&
              ` across ${pathCheckResult.totalBatches} batch request${
                pathCheckResult.totalBatches === 1 ? "" : "s"
              }.`}
          </Alert>
        </Grid>
      )}
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={2}>
          {uploading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={24} />
              <span>Starting batch job...</span>
            </Box>
          ) : (
            <>
              <Button
                variant="outlined"
                sx={styles.button}
                onClick={checkPath}
                disabled={!bucketName.trim() || checkingPath}
              >
                {checkingPath ? "Checking..." : "Check Bucket/Path"}
              </Button>
              <Button
                variant="contained"
                sx={styles.button}
                onClick={submit}
                disabled={!bucketName.trim() || checkingPath}
              >
                Start Batch Processing
              </Button>
            </>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
};

export default UploadGcsDirectory;
