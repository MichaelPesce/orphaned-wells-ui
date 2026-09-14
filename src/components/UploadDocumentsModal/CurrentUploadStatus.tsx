import { Alert, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { getProcessingJobDetails } from "../../services/app.service";
import { ProcessingJobDetails } from "../../types";
import { useProcessingQuery } from "../UploadHistory/useProcessingQuery";
import { isActiveJob, jobStatusLabels, jobStages } from "../UploadHistory/jobPresentation";

const CurrentUploadStatus = ({recordGroupId, jobId, onClose}: {recordGroupId: string; jobId: string; onClose?: () => void}) => {
  const {data, error} = useProcessingQuery<ProcessingJobDetails>(getProcessingJobDetails, [recordGroupId, jobId, "records", 0], (result) => isActiveJob(result.job));
  const job = data?.job;
  return <Stack spacing={0.5}>
    <Typography variant="body2">{job ? jobStatusLabels[job.status] : "Upload submitted. Loading processing status…"}</Typography>
    {!job && !error && <LinearProgress />}
    {error && <Alert severity="warning">{error}</Alert>}
    {job && <Typography variant="body2">{job.summary.total_succeeded} processed · {job.summary.total_failed} failed · {job.summary.total_skipped_duplicates} duplicates skipped</Typography>}
    {job && isActiveJob(job) && <Typography variant="caption">{jobStages[job.stage || ""] || "Processing continues after you close this dialog."}</Typography>}
    <Stack direction="row" spacing={1}>
      <Button size="small" component={Link} to={`/record_group/${recordGroupId}/uploads?job=${jobId}`}>Upload details</Button>
      <Button size="small" component={Link} to={`/record_group/${recordGroupId}`} onClick={onClose}>View records</Button>
    </Stack>
  </Stack>;
};
export default CurrentUploadStatus;
