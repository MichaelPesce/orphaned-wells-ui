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
import { batchProcessDocuments } from "../../services/app.service";
import { callAPI } from "../../util";

interface UploadGcsDirectoryProps {
  runCleaningFunctions: boolean;
  setRunCleaningFunctions: (run: boolean) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
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

  const styles = {
    form: {
      marginTop: 2,
    },
    button: {
      borderRadius: "8px",
      width: 220,
    },
    guidance: {
      color: "#616161",
      fontSize: "0.9rem",
      marginTop: 0,
    },
  };

  const submit = () => {
    const trimmedBucketName = bucketName.trim();
    const trimmedPrefix = prefix.trim().replace(/^\/+/, "");

    if (!trimmedBucketName) {
      setErrorMessage("Bucket name is required.");
      return;
    }

    if (trimmedBucketName.startsWith("gs://") || trimmedBucketName.includes("/")) {
      setErrorMessage("Enter only the bucket name. Do not include gs:// or a folder path.");
      return;
    }

    setErrorMessage("");
    setJobId("");
    setUploading(true);

    callAPI(
      batchProcessDocuments,
      [
        params.id,
        {
          bucketName: trimmedBucketName,
          prefix: trimmedPrefix,
          runCleaningFunctions,
        },
      ],
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
          onChange={(e) => setBucketName(e.target.value)}
          disabled={uploading}
          helperText="Use only the bucket name. Do not include gs://."
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Prefix or folder path"
          placeholder="incoming/well-records/"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          disabled={uploading}
          helperText="Optional. Leave blank to process the whole bucket."
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
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="center">
          {uploading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={24} />
              <span>Starting batch job...</span>
            </Box>
          ) : (
            <Button
              variant="contained"
              sx={styles.button}
              onClick={submit}
              disabled={!bucketName.trim()}
            >
              Start Batch Processing
            </Button>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
};

export default UploadGcsDirectory;
