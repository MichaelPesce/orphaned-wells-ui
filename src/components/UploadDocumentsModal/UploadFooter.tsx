import { ReactNode } from "react";
import { Box, Button, DialogActions, Stack } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { Link, useParams } from "react-router-dom";

const UploadFooter = ({status, children, busy = false, compact = false}: {status: ReactNode; children?: ReactNode; busy?: boolean; compact?: boolean}) => {
  const {id = ""} = useParams<{id: string}>();
  return <DialogActions sx={{display: "block", borderTop: 1, borderColor: "divider", px: 3, py: 2, flexShrink: 0, bgcolor: "grey.50"}}>
    <Box data-cy="upload-status-region" aria-live="polite" sx={{height: compact ? 40 : {xs: 112, sm: 96}, overflow: "auto", mb: 1, color: "text.secondary"}}>{status}</Box>
    <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1}}>
      <Button component={Link} to={`/record_group/${id}/uploads`} disabled={busy} size="small" startIcon={<HistoryIcon />} sx={{color: "text.secondary", px: 0.5, flexShrink: 0}}>Upload history</Button>
      <Stack direction="row" justifyContent="flex-end" gap={1} sx={{minHeight: 36, ml: "auto", "& .MuiButton-contained": {boxShadow: "none", px: 2.5}}}>{children}</Stack>
    </Box>
  </DialogActions>;
};

export default UploadFooter;
