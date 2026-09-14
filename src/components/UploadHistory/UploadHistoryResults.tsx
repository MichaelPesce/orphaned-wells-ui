import { useEffect, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getProcessingJobHistory } from "../../services/app.service";
import { FilterOption, ProcessingJob, ProcessingJobHistory } from "../../types";
import { convertFiltersToMongoFormat } from "../../util";
import UploadHistoryFilters from "./UploadHistoryFilters";
import UploadHistoryTable from "./UploadHistoryTable";
import { useProcessingQuery } from "./useProcessingQuery";

interface Props {
  projectId: string;
  recordGroupId: string;
  revision: number;
  onOpen: (job: ProcessingJob) => void;
}

const UploadHistoryResults = ({projectId, recordGroupId, revision, onOpen}: Props) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [page, setPage] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const {data, loading, error, refresh} = useProcessingQuery<ProcessingJobHistory>(getProcessingJobHistory, [{
    page, active_page: activePage, page_size: 25,
    ...(projectId ? {project_id: projectId} : {}),
    ...(recordGroupId ? {record_group_id: recordGroupId} : {}),
    filter: convertFiltersToMongoFormat(filters),
  }], (result) => result.active_count > 0);
  useEffect(() => {if (revision) refresh();}, [revision, refresh]);
  useEffect(() => {
    if (!data) return;
    if (activePage > 0 && activePage * 25 >= data.active_count) setActivePage(Math.max(0, Math.ceil(data.active_count / 25) - 1));
    if (page > 0 && page * 25 >= data.count) setPage(Math.max(0, Math.ceil(data.count / 25) - 1));
  }, [data, activePage, page]);

  return <Stack spacing={2.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Typography variant="caption" color="text.secondary">{data?.active_count ? "Updates every 5 seconds while uploads are active." : "Newest uploads first."}</Typography>
      <Button size="small" startIcon={<RefreshIcon />} onClick={refresh} disabled={loading} sx={{textTransform: "none", flexShrink: 0, whiteSpace: "nowrap"}}>Refresh uploads</Button>
    </Stack>
    {error && <Alert severity="error" action={<Button onClick={refresh}>Retry</Button>}>{error}</Alert>}
    <UploadHistoryTable title="Active uploads" jobs={data?.active_jobs || []} count={data?.active_count || 0} loading={loading} page={activePage} onPage={setActivePage} onOpen={onOpen} emptyMessage="No active uploads in this selection." />
    <UploadHistoryTable title="Finished uploads" jobs={data?.jobs || []} count={data?.count || 0} loading={loading} page={page} onPage={setPage} onOpen={onOpen} emptyMessage="No finished uploads match this selection."
      filters={<UploadHistoryFilters onApply={(next) => {setFilters(next); setPage(0);}} />} />
  </Stack>;
};

export default UploadHistoryResults;
