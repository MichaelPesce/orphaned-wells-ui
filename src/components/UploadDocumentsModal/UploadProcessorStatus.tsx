import { useEffect, useState } from "react";
import { Box, Button, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { checkProcessorStatus, deployProcessor, undeployProcessor } from "../../services/app.service";
import { callAPI } from "../../util";

const UploadProcessorStatus = ({recordGroupId, busy, permitted, onReady}: {recordGroupId: string; busy: boolean; permitted: boolean; onReady: (ready: boolean) => void}) => {
  const [state, setState] = useState(10);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => callAPI(checkProcessorStatus, [recordGroupId], (value: number) => {
      if (cancelled) return;
      setState(value); setError(""); onReady(value === 1);
      if (value === 2 || value > 3) timer = setTimeout(check, 5000);
    }, () => { if (!cancelled) {setError("Unable to check processor status."); onReady(false);} });
    check();
    return () => {cancelled = true; clearTimeout(timer);};
  }, [recordGroupId, revision, onReady]);
  const deploy = () => {
    onReady(false); setState(10);
    callAPI(state === 1 ? undeployProcessor : deployProcessor, [recordGroupId], (value: number) => {
      setState(value); onReady(value === 1); setRevision((old) => old + 1);
    }, () => {setError("Unable to change processor deployment."); setState(3);});
  };
  const status = error ? "Processor unavailable" : state === 1 ? "Processor deployed" : state === 3 ? "Processor undeployed" : state === 2 ? "Processor deploying" : "Checking processor";
  return <Box sx={{flexShrink: 0, py: 0.75}}>
    <Tooltip title={error || "Processor status and deployment"}>
      <span>
        <Button id="upload-processor-control" size="small" aria-haspopup="menu" aria-expanded={Boolean(anchor)} aria-controls={anchor ? "upload-processor-menu" : undefined}
          disabled={busy || !permitted || (!error && state !== 1 && state !== 3)} onClick={(event) => setAnchor(event.currentTarget)}
          endIcon={<ArrowDropDownIcon />} sx={{fontSize: 12, color: "text.secondary", textTransform: "none", fontWeight: 400, px: 1, minWidth: 170}}>
          <Box component="span" sx={{width: 7, height: 7, borderRadius: "50%", bgcolor: error ? "error.main" : state === 1 ? "success.main" : state === 3 ? "text.disabled" : "warning.main", mr: 1}} />
          {status}
        </Button>
      </span>
    </Tooltip>
    <Menu id="upload-processor-menu" anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} MenuListProps={{"aria-labelledby": "upload-processor-control"}}>
      {error && <Typography variant="body2" color="error" sx={{px: 2, py: 1, maxWidth: 280}}>{error}</Typography>}
      <MenuItem disabled={busy || !permitted} onClick={() => {setAnchor(null); if (error) {setError(""); setRevision((old) => old + 1);} else deploy();}}>
        {error ? "Retry status check" : state === 1 ? "Undeploy processor" : "Deploy processor"}
      </MenuItem>
    </Menu>
  </Box>;
};
export default UploadProcessorStatus;
