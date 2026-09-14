import { useEffect, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Subheader from "../../components/Subheader/Subheader";
import UploadHistoryTable from "../../components/UploadHistory/UploadHistoryTable";
import UploadHistoryFilters from "../../components/UploadHistory/UploadHistoryFilters";
import UploadJobDetails from "../../components/UploadHistory/UploadJobDetails";
import { useProcessingQuery } from "../../components/UploadHistory/useProcessingQuery";
import { getProcessingJobHistory, getRecordGroup } from "../../services/app.service";
import { FilterOption, ProcessingJobHistory } from "../../types";
import { callAPI, convertFiltersToMongoFormat } from "../../util";

const UploadHistoryPage = () => {
  const {id = ""} = useParams<{id: string}>();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const [name, setName] = useState("Record group");
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [page, setPage] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const {data, loading, error, refresh} = useProcessingQuery<ProcessingJobHistory>(getProcessingJobHistory, [id, {page, active_page: activePage, page_size: 25, filter: convertFiltersToMongoFormat(filters)}], (result) => result.active_count > 0 || result.active_jobs.length > 0);
  useEffect(() => {
    let cancelled = false;
    callAPI(getRecordGroup, [id], (result) => {if (!cancelled) setName(result.rg_data.name);}, () => {});
    return () => {cancelled = true;};
  }, [id]);
  useEffect(() => {
    if (!data) return;
    if (activePage > 0 && activePage * 25 >= data.active_count) setActivePage(Math.max(0, Math.ceil(data.active_count / 25) - 1));
    if (page > 0 && page * 25 >= data.count) setPage(Math.max(0, Math.ceil(data.count / 25) - 1));
  }, [data, activePage, page]);
  const jobId = search.get("job");
  return <Box sx={{minHeight: "100vh", bgcolor: "background.default"}}>
    <Subheader currentPage="Upload history" previousPages={{[name]: () => navigate(`/record_group/${id}`)}} actions={{"Refresh uploads": refresh}} />
    <Stack spacing={2} sx={{p: {xs: 2, md: 4}, minWidth: 0}}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="body2">History covers local directory uploads and GCS batches after submission. Single-file, ZIP, and local-storage fallback uploads are not included.</Typography>
        <Button component={Link} to={`/record_group/${id}`} sx={{flexShrink: 0}}>View records</Button>
      </Stack>
      {error && <Alert severity="error" action={<Button onClick={refresh}>Retry</Button>}>{error}</Alert>}
      <UploadHistoryTable title="Active uploads" jobs={data?.active_jobs || []} count={data?.active_count || 0} loading={loading} page={activePage} onPage={setActivePage} onOpen={(job) => setSearch({job})} />
      <Box>
        <UploadHistoryFilters onApply={(next) => {setFilters(next); setPage(0);}} />
        <UploadHistoryTable title="Finished uploads" jobs={data?.jobs || []} count={data?.count || 0} loading={loading} page={page} onPage={setPage} onOpen={(job) => setSearch({job})} />
      </Box>
    </Stack>
    {jobId && <UploadJobDetails key={jobId} recordGroupId={id} jobId={jobId} onClose={() => setSearch({})} onRetry={refresh} />}
  </Box>;
};
export default UploadHistoryPage;
