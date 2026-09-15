import { useState } from "react";
import { Box, Button, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import useUploadProcessor from "./useUploadProcessor";

const UploadProcessorStatus = ({recordGroupId, busy, permitted, onReady}: {recordGroupId: string; busy: boolean; permitted: boolean; onReady: (ready: boolean) => void}) => {
  const {state, error, status, retry, changeDeployment} = useUploadProcessor(recordGroupId, onReady);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const canChangeDeployment = state === 1 || state === 3;
  return <Box sx={{flexShrink: 0, py: 0.75}} aria-live="polite">
    <Tooltip title={error || "Processor status and deployment"}>
      <span>
        <Button id="upload-processor-control" size="small" aria-haspopup="menu" aria-expanded={Boolean(anchor)} aria-controls={anchor ? "upload-processor-menu" : undefined}
          disabled={busy || !permitted || (!error && !canChangeDeployment)} onClick={(event) => setAnchor(event.currentTarget)}
          endIcon={<ArrowDropDownIcon />} sx={{fontSize: 12, color: "text.secondary", textTransform: "none", fontWeight: 400, px: 1, minWidth: 170}}>
          <Box component="span" sx={{width: 7, height: 7, borderRadius: "50%", bgcolor: error ? "error.main" : state === 1 ? "success.main" : state === 3 ? "text.disabled" : "warning.main", mr: 1}} />
          {status}
        </Button>
      </span>
    </Tooltip>
    <Menu id="upload-processor-menu" anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} MenuListProps={{"aria-labelledby": "upload-processor-control"}}>
      {error && <Typography variant="body2" color="error" sx={{px: 2, py: 1, maxWidth: 280}}>{error}</Typography>}
      <MenuItem disabled={busy || !permitted || (!error && !canChangeDeployment)} onClick={() => {setAnchor(null); if (error) retry(); else changeDeployment();}}>
        {error ? "Retry status check" : state === 1 ? "Undeploy processor" : "Deploy processor"}
      </MenuItem>
    </Menu>
  </Box>;
};
export default UploadProcessorStatus;
