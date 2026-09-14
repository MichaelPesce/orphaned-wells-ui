import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, LinearProgress, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
import { ProcessingJob } from "../../types";
import { jobDuration, jobStatusLabels, jobTime } from "./jobPresentation";

interface Props {
  title: string;
  jobs: ProcessingJob[];
  count: number;
  loading: boolean;
  page: number;
  onPage: (page: number) => void;
  onOpen: (job: ProcessingJob) => void;
  emptyMessage: string;
  filters?: ReactNode;
}

const UploadHistoryTable = ({title, jobs, count, loading, page, onPage, onOpen, emptyMessage, filters}: Props) => (
  <Paper component="section" variant="outlined" sx={{minWidth: 0, borderRadius: 2, overflow: "hidden"}}>
    <Stack direction="row" alignItems="center" gap={1} sx={{px: 2, py: 1.5}}>
      <Typography variant="subtitle1" component="h3" fontWeight={600}>{title}</Typography>
      <Chip size="small" label={loading ? "…" : count} sx={{height: 24, fontVariantNumeric: "tabular-nums"}} />
    </Stack>
    {filters}
    <Box sx={{height: 3}}>{loading && <LinearProgress sx={{height: 3}} />}</Box>
    <TableContainer sx={{overflowX: "auto"}}>
      <Table size="small" aria-label={title} sx={{minWidth: 1100, tableLayout: "fixed", "& th": {bgcolor: "grey.50", color: "text.secondary", fontWeight: 600, whiteSpace: "nowrap"}, "& td": {py: 1.5, verticalAlign: "middle"}}}>
        <colgroup>{[19, 20, 12, 19, 14, 8, 8].map((width, index) => <col key={index} style={{width: `${width}%`}} />)}</colgroup>
        <TableHead><TableRow>
          {["Submitted / uploader", "Project / record group", "Source", "Status", "Results", "Elapsed", ""].map((heading) => <TableCell key={heading}>{heading}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>
          {!jobs.length && <TableRow><TableCell colSpan={7} sx={{height: 88, textAlign: "center", color: "text.secondary"}}>{loading ? "Loading uploads…" : emptyMessage}</TableCell></TableRow>}
          {jobs.map((job) => <TableRow key={job.job_id} hover>
            <TableCell sx={{maxWidth: 220}}>
              <Typography variant="body2">{jobTime(job.created_at)}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{overflowWrap: "anywhere"}}>{job.request_user.email}</Typography>
            </TableCell>
            <TableCell sx={{maxWidth: 240, overflowWrap: "anywhere"}}>
              <Typography variant="body2" fontWeight={500}>{job.project_name || job.project_id || "Project unavailable"}</Typography>
              <Link component={RouterLink} to={`/record_group/${job.record_group_id}`} variant="caption" color="text.secondary" underline="hover">{job.record_group_name || job.record_group_id}</Link>
            </TableCell>
            <TableCell>{job.input.upload_session_id ? "Local directory" : "GCS batch"}</TableCell>
            <TableCell><Chip size="small" label={jobStatusLabels[job.status]} color={job.status === "error" ? "error" : job.status === "completed_with_errors" ? "warning" : job.status === "completed" ? "success" : "default"} variant="outlined" /></TableCell>
            <TableCell sx={{whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums"}}>
              <Typography variant="body2">{job.summary.total_succeeded} / {job.file_count ?? "?"} processed</Typography>
              <Typography variant="caption" color={job.summary.total_failed ? "error.main" : "text.secondary"}>{job.summary.total_failed} failed · {job.summary.total_skipped_duplicates} skipped</Typography>
              {job.file_count == null && <Typography variant="caption" display="block" color="text.secondary">Pending discovery</Typography>}
            </TableCell>
            <TableCell sx={{whiteSpace: "nowrap"}}>{jobDuration(job)}</TableCell>
            <TableCell><Button size="small" aria-label={`View upload ${job.job_id}`} onClick={() => onOpen(job)} sx={{textTransform: "none", minWidth: 0}}>Details</Button></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination component="div" count={loading ? -1 : count} page={loading ? page : Math.min(page, Math.max(0, Math.ceil(count / 25) - 1))}
      onPageChange={(_, next) => onPage(next)} rowsPerPage={25} rowsPerPageOptions={[25]}
      nextIconButtonProps={{disabled: loading || (page + 1) * 25 >= count}} sx={{"& .MuiTablePagination-toolbar": {minHeight: 48}}} />
  </Paper>
);

export default UploadHistoryTable;
