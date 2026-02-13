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

type HistoryAttribute = {
  key?: unknown;
  value?: unknown;
  normalized_value?: unknown;
  text_value?: unknown;
  raw_text?: unknown;
};

type QuerySummary = {
  title: string;
  subtitle?: string;
  lines: string[];
};

const SHOW_QUERY_SUMMARY = false;

const getAttributesList = (payload?: Record<string, unknown> | null): HistoryAttribute[] => {
  if (!payload || typeof payload !== "object") return [];
  const attrs = payload.attributesList;
  return Array.isArray(attrs) ? (attrs as HistoryAttribute[]) : [];
};

const getAttributeValue = (attr: HistoryAttribute): unknown => {
  if (attr.normalized_value !== undefined && attr.normalized_value !== null) {
    return attr.normalized_value;
  }
  if (attr.value !== undefined && attr.value !== null) return attr.value;
  if (attr.text_value !== undefined && attr.text_value !== null) return attr.text_value;
  return attr.raw_text;
};

const isMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const formatKey = (key: string): string =>
  key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "empty";
  if (typeof value === "string") return value.trim() || "empty";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.length} values]`;
  if (typeof value === "object") return "{...}";
  return String(value);
};

const areValuesEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (
    (typeof a === "object" && a !== null) ||
    (typeof b === "object" && b !== null)
  ) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (_error) {
      return false;
    }
  }
  return false;
};

const buildQuerySummary = (
  query?: Record<string, unknown> | null,
  previousState?: Record<string, unknown> | null
): QuerySummary | null => {
  if (!query || typeof query !== "object") return null;

  const queryAttributes = getAttributesList(query);
  const prevAttributes = getAttributesList(previousState);

  const queryMap = new Map<string, unknown>();
  queryAttributes.forEach((attr) => {
    if (typeof attr.key === "string" && attr.key) {
      queryMap.set(attr.key, getAttributeValue(attr));
    }
  });

  const prevMap = new Map<string, unknown>();
  prevAttributes.forEach((attr) => {
    if (typeof attr.key === "string" && attr.key) {
      prevMap.set(attr.key, getAttributeValue(attr));
    }
  });

  const changedLines: string[] = [];
  const changedFields: string[] = [];
  const keys = new Set<string>([
    ...Array.from(queryMap.keys()),
    ...Array.from(prevMap.keys()),
  ]);

  keys.forEach((key) => {
    const currentValue = queryMap.get(key);
    const previousValue = prevMap.get(key);
    if (!areValuesEqual(currentValue, previousValue)) {
      changedFields.push(key);
      changedLines.push(
        `${formatKey(key)}: ${formatValue(previousValue)} -> ${formatValue(currentValue)}`
      );
    }
  });

  if (changedLines.length > 0) {
    return {
      title: "Query changes",
      subtitle: `${changedFields.length} field${changedFields.length === 1 ? "" : "s"} changed`,
      lines: changedLines.slice(0, 6),
    };
  }

  const populatedFields = queryAttributes
    .filter((attr) => typeof attr.key === "string" && attr.key)
    .map((attr) => ({
      key: attr.key as string,
      value: getAttributeValue(attr),
    }))
    .filter((entry) => isMeaningfulValue(entry.value));

  if (populatedFields.length > 0) {
    return {
      title: "Query snapshot",
      subtitle: `${populatedFields.length} populated field${
        populatedFields.length === 1 ? "" : "s"
      }`,
      lines: populatedFields
        .slice(0, 6)
        .map((entry) => `${formatKey(entry.key)}: ${formatValue(entry.value)}`),
    };
  }

  return {
    title: "Query snapshot",
    subtitle: "No populated fields detected",
    lines: [],
  };
};

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
        <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
          Record History
        </Typography>
        <Typography component="div" variant="body2" sx={{ color: "#6B7280", mt: 0.5 }}>
          Activity timeline
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
                const noteText = (item.notes || "").trim();
                const querySummary = SHOW_QUERY_SUMMARY
                  ? buildQuerySummary(item.query, item.previous_state)
                  : null;
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

                    <Divider sx={{ my: 1.25 }} />

                    {querySummary ? (
                      <Box>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                          {querySummary.title}
                        </Typography>
                        {querySummary.subtitle && (
                          <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 0.25 }}>
                            {querySummary.subtitle}
                          </Typography>
                        )}
                        {querySummary.lines.length > 0 && (
                          <Stack spacing={0.35} sx={{ mt: 0.8 }}>
                            {querySummary.lines.map((line) => (
                              <Typography
                                key={line}
                                sx={{ fontSize: "12px", color: "#374151", wordBreak: "break-word" }}
                              >
                                {line}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    ) : noteText ? (
                      <Typography sx={{ fontSize: "13px", color: "#374151" }}>
                        {noteText}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>
                        No query details or notes.
                      </Typography>
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
