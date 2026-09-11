import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, Button, FormControlLabel, LinearProgress, Stack, Switch, TextField, Typography } from "@mui/material";
import { useUserContext } from "../../usercontext";
import { DirectoryUploadConfig, UploadDirectoryProps } from "../../types";
import { checkForDuplicateRecords, getDirectoryUploadConfig } from "../../services/app.service";
import { requestUploadApi, filePath } from "./uploadApi";
import { useDirectoryUpload } from "./useDirectoryUpload";
import ProcessingJobs from "./ProcessingJobs";

const UploadDirectory = ({directoryName, directoryFiles, runCleaningFunctions, setRunCleaningFunctions, uploading, setUploading}: UploadDirectoryProps) => {
  const {id = ""} = useParams<{id: string}>();
  const {userEmail, hasPermission} = useUserContext();
  const [amount, setAmount] = useState(Math.min(directoryFiles.length, 1000));
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [config, setConfig] = useState<DirectoryUploadConfig>();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const upload = useDirectoryUpload(id, userEmail, setUploading);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setError("");
    Promise.all([
      requestUploadApi<DirectoryUploadConfig>(getDirectoryUploadConfig, [id]),
      requestUploadApi<string[]>(checkForDuplicateRecords, [{file_list: directoryFiles.map((file) => file.name)}, id]),
    ]).then(([configuration, existing]) => {
      if (!cancelled) { setConfig(configuration); setDuplicates(existing); }
    }).catch((failure) => {
      if (!cancelled) setError(failure.message);
    }).finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [id, directoryFiles, checkAttempt]);

  const files = useMemo(() => {
    const seen = new Set(duplicates);
    return directoryFiles.filter((file) => {
      const base = file.name.replace(/\.[^.]+$/, "");
      if (!preventDuplicates) return true;
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    }).slice(0, Math.max(0, amount));
  }, [directoryFiles, duplicates, preventDuplicates, amount]);
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  const tooLarge = config && (files.some((file) => file.size <= 0 || file.size > config.max_file_bytes) || totalBytes > config.max_total_bytes);
  const disabled = checking || !!error || !config || config.mode === "unavailable" || !files.length || !Number.isInteger(amount) || amount < 1 || amount > (config?.max_files || 1000) || !!tooLarge || !hasPermission("upload_document");

  return <Stack spacing={2} sx={{width: "100%"}}>
    <Typography>Upload files from <strong>{directoryName}</strong>.</Typography>
    <TextField data-cy="directory-upload-amount-input" label="Upload amount" type="number"
      value={amount} onChange={(event) => setAmount(Number(event.target.value))}
      inputProps={{min: 1, max: config?.max_files || 1000}} disabled={uploading || upload.finished} />
    <Typography><strong>{files.length}</strong> files to be uploaded</Typography>
    <Box sx={{maxHeight: "25vh", overflow: "auto", border: 1, borderColor: "divider", p: 1}}>
      {files.map((file) => <Typography key={filePath(file)} variant="body2" color={upload.fileErrors.includes(filePath(file)) ? "error" : "text.primary"} sx={{overflowWrap: "anywhere"}}>
        {filePath(file)}{upload.fileErrors.includes(filePath(file)) ? " — transfer failed" : ""}
      </Typography>)}
    </Box>
    <Stack direction="row" flexWrap="wrap">
      <FormControlLabel data-cy="directory-prevent-duplicates-toggle" label="Prevent Duplicates"
        control={<Switch checked={preventDuplicates} onChange={(event) => setPreventDuplicates(event.target.checked)} />}
        disabled={uploading || upload.finished} />
      <FormControlLabel data-cy="directory-run-cleaning-toggle" label="Run cleaning functions"
        control={<Switch checked={runCleaningFunctions} onChange={(event) => setRunCleaningFunctions(event.target.checked)} />}
        disabled={uploading || upload.finished} />
    </Stack>
    {checking && <LinearProgress />}
    {error && <Alert severity="error" action={<Button onClick={() => setCheckAttempt((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
    {config?.mode === "unavailable" && <Alert severity="error">Directory uploads are not configured for this environment.</Alert>}
    {tooLarge && <Alert severity="error">Files must be nonempty and within the configured limits: {Math.floor(config!.max_file_bytes / 1024 / 1024)} MiB per file and {Math.floor(config!.max_total_bytes / 1024**3)} GiB per directory.</Alert>}
    {config?.mode === "direct" && !upload.finished && <Typography variant="body2">Keep this window open until file transfer finishes. Processing then continues in the background. To resume after a refresh, select the same directory and upload options again.</Typography>}
    {upload.error && <Alert severity="error">{upload.error}</Alert>}
    {uploading && <Box>
      <Typography>{upload.phase}: {upload.transferred} of {files.length} files transferred</Typography>
      <LinearProgress variant="determinate" value={upload.progress} sx={{my: 1}} />
      {upload.phase === "Transferring files" && <Button onClick={upload.pause}>Pause transfer</Button>}
    </Box>}
    {!uploading && !upload.finished && <Button data-cy="directory-upload-button" variant="contained" disabled={disabled}
      onClick={() => config && config.mode !== "unavailable" && upload.start(files, config.mode, preventDuplicates, runCleaningFunctions)}>
      {upload.error ? "Retry upload" : "Upload"}
    </Button>}
    {upload.finished && <Alert severity="success">{upload.job ? "Files transferred. Processing status appears below." : "Files submitted for processing."}</Alert>}
    <ProcessingJobs recordGroupId={id} latestJobId={upload.job?.job_id} />
  </Stack>;
};

export default UploadDirectory;
