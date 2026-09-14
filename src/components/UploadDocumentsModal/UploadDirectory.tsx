import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, Button, DialogContent, FormControlLabel, LinearProgress, Stack, Switch, TextField, Typography } from "@mui/material";
import { useUserContext } from "../../usercontext";
import { DirectoryUploadConfig, UploadDirectoryProps } from "../../types";
import { checkForDuplicateRecords, getDirectoryUploadConfig } from "../../services/app.service";
import { requestUploadApi, filePath } from "./uploadApi";
import { useDirectoryUpload } from "./useDirectoryUpload";
import CurrentUploadStatus from "./CurrentUploadStatus";
import UploadFooter from "./UploadFooter";

const UploadDirectory = ({directoryName, directoryFiles, runCleaningFunctions, setRunCleaningFunctions, uploading, setUploading, onClose, processorReady = true}: UploadDirectoryProps) => {
  const {id = ""} = useParams<{id: string}>();
  const {userEmail, hasPermission} = useUserContext();
  const [amount, setAmount] = useState(String(Math.min(directoryFiles.length, 1000)));
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
    }).slice(0, Math.max(0, Number(amount)));
  }, [directoryFiles, duplicates, preventDuplicates, amount]);
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  const tooLarge = config && (files.some((file) => file.size <= 0 || file.size > config.max_file_bytes) || totalBytes > config.max_total_bytes);
  const disabled = !processorReady || checking || !!error || !config || config.mode === "unavailable" || !files.length || !Number.isInteger(Number(amount)) || Number(amount) < 1 || Number(amount) > (config?.max_files || 1000) || !!tooLarge || !hasPermission("upload_document");

  const renderStatus = () => {
    if (upload.job) return <CurrentUploadStatus recordGroupId={id} jobId={upload.job.job_id} onClose={onClose} />;
    if (upload.finished) return <Alert severity="success">Files submitted for processing. Follow their progress in the records table.</Alert>;
    if (uploading) return <Box>
      <Typography variant="body2">{upload.phase}: {upload.transferred} of {files.length} files transferred</Typography>
      <LinearProgress variant={upload.phase === "Transferring files" ? "determinate" : "indeterminate"} value={upload.progress} sx={{my: 1}} />
      <Typography variant="caption">Keep this dialog open until transfer and verification finish. Pause stops file transfer; it does not cancel processing.</Typography>
    </Box>;
    if (checking) return <Box><Typography variant="body2">Checking files and upload configuration…</Typography><LinearProgress sx={{my: 1}} /></Box>;
    if (error) return <Alert severity="error" action={<Button onClick={() => setCheckAttempt((value) => value + 1)}>Retry</Button>}>{error}</Alert>;
    if (upload.error) return <Alert severity="warning">{upload.error}</Alert>;
    if (config?.mode === "unavailable") return <Alert severity="error">Directory uploads are not configured for this environment.</Alert>;
    if (tooLarge) return <Alert severity="error">Files must be nonempty and within the configured limits: {Math.floor(config!.max_file_bytes / 1024 / 1024)} MiB per file and {Math.floor(config!.max_total_bytes / 1024**3)} GiB per directory.</Alert>;
    return <Typography variant="body2">Keep this dialog open until file transfer finishes. To resume after a refresh, select the same directory and options again.</Typography>;
  };

  return <>
    <DialogContent dividers sx={{display: "flex"}}>
      <Stack spacing={1.5} sx={{flex: 1, minWidth: 0, minHeight: 0}}>
        <Stack direction={{xs: "column", sm: "row"}} alignItems={{sm: "center"}} justifyContent="space-between" gap={1} sx={{flexShrink: 0}}>
          <Typography sx={{overflowWrap: "anywhere"}}>Directory: <strong>{directoryName}</strong></Typography>
          <TextField data-cy="directory-upload-amount-input" label="Upload amount" type="number" size="small" sx={{width: 180, flexShrink: 0}}
            value={amount} onChange={(event) => setAmount(event.target.value)}
            inputProps={{min: 1, max: config?.max_files || 1000}} disabled={uploading || upload.finished} />
        </Stack>
        <Typography variant="body2" sx={{flexShrink: 0}}><strong>{files.length}</strong> files to be uploaded · {(totalBytes / 1024 / 1024).toFixed(1)} MiB</Typography>
        <Box data-cy="directory-file-list" tabIndex={0} aria-label="Selected files" sx={{height: 240, maxHeight: 240, minHeight: 120, flex: "1 1 240px", boxSizing: "border-box", overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1, p: 1.5}}>
          {!files.length && <Typography variant="body2">No supported files to upload with these options.</Typography>}
          {files.map((file) => <Typography key={filePath(file)} variant="body2" color={upload.fileErrors.includes(filePath(file)) ? "error" : "text.primary"} sx={{overflowWrap: "anywhere"}}>
            {filePath(file)}{upload.fileErrors.includes(filePath(file)) ? " — transfer failed" : ""}
          </Typography>)}
        </Box>
        <Stack direction="row" flexWrap="wrap" sx={{flexShrink: 0}}>
          <FormControlLabel data-cy="directory-prevent-duplicates-toggle" label="Prevent Duplicates"
            control={<Switch checked={preventDuplicates} onChange={(event) => setPreventDuplicates(event.target.checked)} />} disabled={uploading || upload.finished} />
          <FormControlLabel data-cy="directory-run-cleaning-toggle" label="Run cleaning functions"
            control={<Switch checked={runCleaningFunctions} onChange={(event) => setRunCleaningFunctions(event.target.checked)} />} disabled={uploading || upload.finished} />
        </Stack>
      </Stack>
    </DialogContent>
    <UploadFooter status={renderStatus()} busy={uploading}>
      {uploading && upload.phase === "Transferring files" && <Button onClick={upload.pause}>Pause transfer</Button>}
      {!uploading && !upload.finished && <Button data-cy="directory-upload-button" variant="contained" disabled={disabled}
        onClick={() => config && config.mode !== "unavailable" && upload.start(files, config.mode, preventDuplicates, runCleaningFunctions)}>
        {upload.error ? "Retry upload" : "Upload"}
      </Button>}
      {upload.finished && <Button onClick={onClose}>Close</Button>}
    </UploadFooter>
  </>;
};

export default UploadDirectory;
