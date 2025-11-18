import { useState } from "react";
import { Typography, IconButton, Paper, Collapse } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface StagingBannerProps {
  isStaging: boolean;
}

const StagingBanner = ({ isStaging }: StagingBannerProps) => {

  const [open, setOpen] = useState(true);

  if (!isStaging) return null;

  return (
    <>
      {!open && (
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3000,
            px: 1.5,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            borderRadius: "0 0 12px 12px",
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
            cursor: "pointer",
          }}
          onClick={() => setOpen(true)}
        >
          <KeyboardArrowDownIcon fontSize="small" />
        </Paper>
      )}
      <Collapse in={open}>
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3000,
            px: 2.5,
            py: 1,
            borderRadius: "0 0 14px 14px",
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: "220px",
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, letterSpacing: 0.5 }}
          >
            STAGING ENVIRONMENT
          </Typography>

          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            sx={{
              color: "secondary.contrastText",
              ml: "auto",
              "&:hover": { opacity: 0.75 }
            }}
          >
            <KeyboardArrowUpIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Collapse>
    </>
  );
};

export default StagingBanner;
