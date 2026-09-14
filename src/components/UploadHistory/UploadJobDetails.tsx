import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { getProcessingJobDetails, retryProcessingJob } from "../../services/app.service";
import { ProcessingJobDetails } from "../../types";
import { callAPI } from "../../util";
import { useUserContext } from "../../usercontext";
import { useProcessingQuery } from "./useProcessingQuery";
import { isActiveJob, jobStages, jobStatusLabels, jobTime } from "./jobPresentation";

const UploadJobDetails = ({recordGroupId, jobId, onClose, onRetry}: {recordGroupId: string; jobId: string; onClose: () => void; onRetry: () => void}) => {
  const [kind, setKind] = useState("records");
  const [page, setPage] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const {hasPermission} = useUserContext();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const {data, error, loading, refresh} = useProcessingQuery<ProcessingJobDetails>(getProcessingJobDetails, [recordGroupId, jobId, kind, page], (result) => isActiveJob(result.job));
  const job = data?.job;
  const retry = () => {
    setRetrying(true); setRetryError("");
    callAPI(retryProcessingJob, [recordGroupId, jobId], () => {setRetrying(false); refresh(); onRetry();}, (failure) => {
      setRetrying(false); setRetryError(typeof failure === "string" ? failure : "Unable to retry processing. Refresh the job details and try again."); refresh();
    });
  };
  return <Dialog open onClose={retrying ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby="upload-details-title" PaperProps={{sx: {height: fullScreen ? "100dvh" : 720}}}>
    <DialogTitle id="upload-details-title">Upload details</DialogTitle>
    <DialogContent dividers>
      <Typography variant="caption" sx={{overflowWrap: "anywhere"}}>Job ID: {jobId}</Typography>
      <Box sx={{height: 4, my: 1}}>{loading && <LinearProgress />}</Box>
      {(error || retryError) && <Alert severity="error">{retryError || error}</Alert>}
      {job && <Stack spacing={1}>
        <Typography variant="h6">{jobStatusLabels[job.status]}</Typography>
        <Typography variant="body2">{job.summary.total_succeeded} processed · {job.summary.total_failed} failed · {job.summary.total_skipped_duplicates} duplicates skipped · {job.file_count ?? "Undiscovered"} files</Typography>
        <Typography variant="body2" sx={{overflowWrap: "anywhere"}}>Source: gs://{job.input.bucket_name}/{job.input.prefix}</Typography>
        <Typography variant="body2">Submitted by {job.request_user.email} at {jobTime(job.created_at)}</Typography>
        <Typography variant="body2">Worker started: {jobTime(job.started_at)} · Completed: {jobTime(job.completed_at)} · Attempt: {(job.attempt || 0) + 1}</Typography>
        <Typography variant="body2">Last worker activity: {job.stage ? jobStages[job.stage] || job.stage : "Not recorded"} · {jobTime(job.last_progress_at)}</Typography>
        {isActiveJob(job) && <Typography variant="caption">Counts update as batches finish. Last activity is not a heartbeat; Document AI can take time between updates.</Typography>}
        {job.error && <Alert severity="error" sx={{overflowWrap: "anywhere"}}>{job.error}</Alert>}
      </Stack>}
      <TextField select label="File details" value={kind} size="small" onChange={(event) => {setKind(event.target.value); setPage(0);}} sx={{my: 2, minWidth: 200}}>
        <MenuItem value="records">Created records</MenuItem><MenuItem value="source">Directory manifest</MenuItem><MenuItem value="failed">Failed files</MenuItem><MenuItem value="skipped">Skipped duplicates</MenuItem>
      </TextField>
      <TableContainer><Table size="small" aria-label="Upload files"><TableHead><TableRow><TableCell>File / record</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
        {!data?.files.length && <TableRow><TableCell colSpan={2}>{loading ? "Loading files…" : kind === "source" && !job?.input.upload_session_id ? "GCS batches discover files in the worker; no directory manifest is stored." : "No files to show."}</TableCell></TableRow>}
        {data?.files.map((file, index) => <TableRow key={`${file.source_uri || file.record_id}-${index}`}>
          <TableCell sx={{overflowWrap: "anywhere"}}>{file.record_id ? <Link to={`/record/${file.record_id}`} state={{group_id: recordGroupId, location: "record_group", sourceRecordGroupId: recordGroupId}}>{file.name}</Link> : file.name}<Typography variant="caption" display="block">{file.source_uri}</Typography></TableCell>
          <TableCell>{file.status || "—"}</TableCell>
        </TableRow>)}
      </TableBody></Table></TableContainer>
      <TablePagination component="div" count={data?.file_count ?? -1} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={25} rowsPerPageOptions={[25]} nextIconButtonProps={{disabled: loading || (data ? (page + 1) * 25 >= data.file_count : true)}} />
    </DialogContent>
    <DialogActions sx={{display: "block", px: 3}}>
      {job && ["error", "completed_with_errors"].includes(job.status) && data?.retry.reason && <Typography variant="body2" sx={{mb: 1}}>{data.retry.reason}</Typography>}
      <Stack direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1}>
        <Button disabled={retrying} onClick={refresh}>Refresh</Button>
        {hasPermission("upload_document") && job && ["error", "completed_with_errors"].includes(job.status) && <Button disabled={retrying || !data?.retry.allowed} onClick={retry}>{retrying ? "Retrying…" : "Retry failed processing"}</Button>}
        <Button disabled={retrying} onClick={onClose}>Close</Button>
      </Stack>
    </DialogActions>
  </Dialog>;
};
export default UploadJobDetails;
