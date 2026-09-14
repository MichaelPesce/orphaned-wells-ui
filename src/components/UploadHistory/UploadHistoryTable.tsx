import { Box, Button, Chip, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
import { ProcessingJob } from "../../types";
import { jobDuration, jobStatusLabels, jobTime } from "./jobPresentation";

interface Props {
  title: string; jobs: ProcessingJob[]; count: number; loading: boolean;
  page: number; onPage: (page: number) => void; onOpen: (id: string) => void;
}
const UploadHistoryTable = ({title, jobs, count, loading, page, onPage, onOpen}: Props) => <Box component="section" sx={{minWidth: 0}}>
  <Typography variant="h6">{title} {!loading && `(${count})`}</Typography>
  <Box sx={{height: 4, mt: 1}}>{loading && <LinearProgress />}</Box>
  <TableContainer component={Paper} sx={{overflowX: "auto"}}>
    <Table size="small" aria-label={title} sx={{minWidth: 760}}>
      <TableHead><TableRow>{["Submitted", "Uploader", "Source", "Status", "Files", "Processed / failed / skipped", "Elapsed", ""].map((heading) => <TableCell key={heading}>{heading}</TableCell>)}</TableRow></TableHead>
      <TableBody>
        {!jobs.length && <TableRow><TableCell colSpan={8} sx={{height: 72}}>{loading ? "Loading uploads…" : "No uploads to show."}</TableCell></TableRow>}
        {jobs.map((job) => <TableRow key={job.job_id} hover>
          <TableCell>{jobTime(job.created_at)}</TableCell>
          <TableCell sx={{maxWidth: 200, overflowWrap: "anywhere"}}>{job.request_user.email}</TableCell>
          <TableCell>{job.input.upload_session_id ? "Local directory" : "GCS batch"}</TableCell>
          <TableCell><Chip size="small" label={jobStatusLabels[job.status]} color={job.status === "error" ? "error" : job.status === "completed_with_errors" ? "warning" : "default"} /></TableCell>
          <TableCell>{job.file_count ?? "Pending discovery"}</TableCell>
          <TableCell>{job.summary.total_succeeded} / {job.summary.total_failed} / {job.summary.total_skipped_duplicates}</TableCell>
          <TableCell>{jobDuration(job)}</TableCell>
          <TableCell><Button size="small" aria-label={`View upload ${job.job_id}`} onClick={() => onOpen(job.job_id)}>Details</Button></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  </TableContainer>
  <TablePagination component="div" count={loading ? -1 : count} page={loading ? page : Math.min(page, Math.max(0, Math.ceil(count / 25) - 1))} onPageChange={(_, next) => onPage(next)} rowsPerPage={25} rowsPerPageOptions={[25]} nextIconButtonProps={{disabled: loading || (page + 1) * 25 >= count}} />
</Box>;
export default UploadHistoryTable;
