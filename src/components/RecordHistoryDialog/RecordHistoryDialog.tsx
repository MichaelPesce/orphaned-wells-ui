import React from "react";
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { RecordHistoryDialogProps } from "../../types";
import { formatDateTime } from "../../util";

const RecordHistoryDialog = ({
  open,
  onClose,
  history,
  loading = false,
}: RecordHistoryDialogProps) => {
  const sortedHistory = [...history]
    .filter(
      (item) => item.notes !== "Auto updating record while fetching record."
    )
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #E5E7EB",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
          borderBottom: "1px solid #EEF2F7",
          py: 2,
          pr: 6,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Record History
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B7280", mt: 0.5 }}>
          Chronological activity timeline
        </Typography>
      </DialogTitle>

      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ maxHeight: "70vh", overflowY: "auto", p: 2 }}>
          {loading ? (
            <Typography sx={{ color: "#6B7280", px: 1, py: 2 }}>
              Loading history...
            </Typography>
          ) : sortedHistory.length === 0 ? (
            <Typography sx={{ color: "#6B7280", px: 1, py: 2 }}>
              No history entries found.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {sortedHistory.map((item, idx) => {
                const userName = item.user || "Unknown user";
                const action = item.action || "unknown_action";
                const noteText = item.notes || "";
                const initial = userName[0]?.toUpperCase() || "?";
                return (
                  <Box
                    key={`${item.timestamp || idx}-${idx}`}
                    sx={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      backgroundColor: "#FFFFFF",
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          fontSize: "13px",
                          bgcolor: "#0F172A",
                        }}
                      >
                        {initial}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#111827",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {userName}
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                          {formatDateTime(item.timestamp)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={action}
                        sx={{
                          backgroundColor: "#EEF2FF",
                          color: "#3730A3",
                          fontWeight: 600,
                          borderRadius: "8px",
                        }}
                      />
                    </Stack>

                    {noteText && (
                      <>
                        <Divider sx={{ my: 1.25 }} />
                        <Typography sx={{ fontSize: "13px", color: "#374151" }}>
                          {noteText}
                        </Typography>
                      </>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RecordHistoryDialog;
