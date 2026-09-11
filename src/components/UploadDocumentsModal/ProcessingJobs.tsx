import { useEffect, useState } from "react";
import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { listProcessingJobs, retryProcessingJob } from "../../services/app.service";
import { ProcessingJob } from "../../types";
import { useUserContext } from "../../usercontext";
import { requestUploadApi } from "./uploadApi";

const statusLabels: Record<ProcessingJob["status"], string> = {
  queued: "Waiting for a processing worker", dispatched: "Starting processing worker",
  running: "Processing documents", completed: "Processing complete",
  completed_with_errors: "Processing completed with errors", error: "Processing failed",
};
const active = (job: ProcessingJob) => ["queued", "dispatched", "running"].includes(job.status);

const ProcessingJobs = ({recordGroupId, latestJobId = ""}: {recordGroupId: string; latestJobId?: string}) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState("");
  const {hasPermission, userEmail} = useUserContext();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      let delay = 15000;
      try {
        const result = await requestUploadApi<ProcessingJob[]>(listProcessingJobs, [recordGroupId]);
        if (!cancelled) { setJobs(result); setError(""); }
        if (result.some(active)) delay = 5000;
      } catch (failure) {
        if (!cancelled) setError("Unable to refresh processing status. Retrying shortly.");
      }
      if (!cancelled) timer = setTimeout(poll, delay);
    };
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [recordGroupId, latestJobId]);

  const retry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      const result = await requestUploadApi<ProcessingJob>(retryProcessingJob, [recordGroupId, jobId]);
      setJobs((previous) => previous.map((job) => job.job_id === jobId ? result : job));
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to retry processing");
    } finally { setRetrying(""); }
  };

  if (!jobs.length && !error) return null;
  return <Stack spacing={1} data-cy="processing-jobs" sx={{mt: 2}}>
    <Typography variant="subtitle1">Recent processing jobs</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {jobs.map((job) => <Box key={job.job_id} sx={{border: 1, borderColor: "divider", borderRadius: 1, p: 1.5}}>
      <Typography>{statusLabels[job.status]}</Typography>
      <Typography variant="caption" sx={{overflowWrap: "anywhere"}}>Job ID: {job.job_id}</Typography>
      {active(job) && <LinearProgress sx={{my: 1}} />}
      <Typography variant="body2">
        {job.summary.total_succeeded} processed · {job.summary.total_failed} failed · {job.summary.total_skipped_duplicates} duplicates skipped
        {job.summary.total_submitted > 0 && ` · ${job.summary.total_submitted} files total`}
      </Typography>
      {job.status === "running" && <Typography variant="caption">Counts update as each batch finishes. Processing continues after you close this window.</Typography>}
      {job.error && <Alert severity="error" sx={{mt: 1}}>{job.error}</Alert>}
      {job.summary.failed_document_uris.length > 0 && <details>
        <summary>Failed files</summary>
        <Box component="ul" sx={{maxHeight: 160, overflow: "auto", overflowWrap: "anywhere"}}>
          {job.summary.failed_document_uris.map((uri) => <li key={uri}>{uri.split("/").pop()}</li>)}
        </Box>
      </details>}
      {!active(job) && <Stack direction="row" spacing={1} sx={{mt: 1}}>
        <Button size="small" onClick={() => window.location.reload()}>Refresh records</Button>
        {job.input.upload_session_id && job.request_user.email === userEmail && hasPermission("upload_document") &&
          ["error", "completed_with_errors"].includes(job.status) &&
          <Button size="small" disabled={!!retrying} onClick={() => retry(job.job_id)}>
            {retrying === job.job_id ? "Retrying..." : "Retry failed processing"}
          </Button>}
      </Stack>}
    </Box>)}
  </Stack>;
};

export default ProcessingJobs;
