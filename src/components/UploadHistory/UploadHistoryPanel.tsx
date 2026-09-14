import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { getProcessingHistoryProjects } from "../../services/app.service";
import { ProcessingHistoryProject, ProcessingJob } from "../../types";
import UploadHistoryScope from "./UploadHistoryScope";
import UploadHistoryResults from "./UploadHistoryResults";
import UploadJobDetails from "./UploadJobDetails";
import { useProcessingQuery } from "./useProcessingQuery";

const UploadHistoryPanel = () => {
  const [search, setSearch] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const projectId = search.get("project") || "";
  const recordGroupId = search.get("record_group") || "";
  const jobId = search.get("job");
  const jobGroupId = search.get("job_group") || recordGroupId;
  const {data: projects, loading, error, refresh} = useProcessingQuery<ProcessingHistoryProject[]>(getProcessingHistoryProjects, [], () => false);
  const changeScope = (project: string, group: string) => {
    const next = new URLSearchParams(search);
    next.delete("project"); next.delete("record_group");
    next.delete("job"); next.delete("job_group");
    if (project) next.set("project", project);
    if (group) next.set("record_group", group);
    setSearch(next);
  };
  const openJob = (job: ProcessingJob) => {
    const next = new URLSearchParams(search);
    next.set("job", job.job_id); next.set("job_group", job.record_group_id);
    setSearch(next);
  };
  const closeJob = () => {
    const next = new URLSearchParams(search);
    next.delete("job"); next.delete("job_group");
    setSearch(next);
  };
  const jobProject = projects?.find((project) => project.record_groups.some((group) => group.id === jobGroupId));
  const jobGroup = jobProject?.record_groups.find((group) => group.id === jobGroupId);

  return <Stack spacing={2.5} sx={{minWidth: 0, textAlign: "left"}}>
    <Stack spacing={0.5}>
      <Typography variant="h6" component="h2">Upload history</Typography>
      <Typography variant="body2" color="text.secondary">Track local directory uploads and GCS batches, inspect results, and retry failed processing.</Typography>
      <Typography variant="caption" color="text.secondary">Single-file, ZIP, and local-storage fallback uploads are not tracked here.</Typography>
    </Stack>
    {error && <Alert severity="error" action={<Button onClick={refresh}>Retry</Button>}>{error}</Alert>}
    <UploadHistoryScope projects={projects || []} projectId={projectId} recordGroupId={recordGroupId} loading={loading && !projects} onChange={changeScope} />
    <UploadHistoryResults key={`${projectId}/${recordGroupId}`} projectId={projectId} recordGroupId={recordGroupId} revision={revision} onOpen={openJob} />
    {jobId && jobGroupId && <UploadJobDetails key={`${jobGroupId}/${jobId}`} recordGroupId={jobGroupId} jobId={jobId}
      projectName={jobProject?.name} recordGroupName={jobGroup?.name}
      onClose={closeJob} onRetry={() => setRevision((value) => value + 1)} />}
    {jobId && !jobGroupId && <Alert severity="warning" onClose={closeJob}>This upload details link is missing its record group. Open Details from the upload list.</Alert>}
  </Stack>;
};

export default UploadHistoryPanel;
