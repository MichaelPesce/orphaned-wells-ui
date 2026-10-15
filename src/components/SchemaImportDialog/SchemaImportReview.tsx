import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Link,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  SchemaImportCandidate,
  SchemaImportDecision,
  SchemaImportDiff,
  SchemaImportGroup,
  SchemaImportPreview,
} from "../../types";

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  border: 0,
};

export function ImportGroups({ groups, label }: { groups: SchemaImportGroup[]; label: string }) {
  if (!groups.length) return null;
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: "1px solid #e4e4e7",
        borderRadius: 2,
        mb: 1,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}>
        <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          {label} ({groups.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={0.75}>
          {groups.map((group) => (
            <Typography key={group.id} variant="body2" sx={{ color: "#71717a" }}>
              {group.name}
              {group.team ? ` · ${group.team}` : ""}
            </Typography>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function FieldDiff({ diff }: { diff: SchemaImportDiff }) {
  const changed = diff.changed.flatMap((field) =>
    Array.from(new Set([...Object.keys(field.before), ...Object.keys(field.after)]))
      .filter((key) => JSON.stringify((field.before as any)[key]) !== JSON.stringify((field.after as any)[key]))
      .map((key) => ({
        name: `${field.name} · ${key.replace(/_/g, " ")}`,
        before: (field.before as any)[key],
        after: (field.after as any)[key],
      }))
  );
  const value = (item: unknown) =>
    item == null ? "—" : typeof item === "object" ? JSON.stringify(item) : String(item);

  return (
    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
      <Typography variant="body2" sx={{ color: "#52525b" }}>
        Added fields: {diff.added.join(", ") || "None"}
      </Typography>
      <Typography variant="body2" sx={{ color: "#52525b" }}>
        Retired fields: {diff.retired.join(", ") || "None"}
      </Typography>
      {(changed.length > 0 || diff.metadata.length > 0) && (
        <Table size="small" aria-label="Schema changes" sx={{ border: "1px solid #e4e4e7", borderRadius: 1.5 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f4f4f5" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Setting</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Current</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Repo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...diff.metadata, ...changed].map((item) => (
              <TableRow key={item.name}>
                <TableCell sx={{ overflowWrap: "anywhere", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  {item.name}
                </TableCell>
                <TableCell sx={{ overflowWrap: "anywhere", fontSize: "0.8125rem" }}>{value(item.before)}</TableCell>
                <TableCell sx={{ overflowWrap: "anywhere", fontSize: "0.8125rem" }}>{value(item.after)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}

function getDiffDescription(diff?: SchemaImportDiff) {
  if (!diff) return "no differences from repo";
  const added = diff.added?.length || 0;
  const retired = diff.retired?.length || 0;
  const changed = diff.changed?.length || 0;
  const metadata = diff.metadata?.length || 0;
  if (added === 0 && retired === 0 && changed === 0 && metadata === 0) {
    return "no differences from repo";
  }
  const parts: string[] = [];
  if (added > 0) parts.push(`+${added} added`);
  if (retired > 0) parts.push(`${retired} retired`);
  if (changed > 0) parts.push(`${changed} changed`);
  if (metadata > 0) parts.push(`${metadata} setting${metadata === 1 ? "" : "s"} changed`);
  return parts.join(", ");
}

function getStatusStyle(action: string) {
  switch (action) {
    case "added":
      return { bgcolor: "#ecfdf5", color: "#059669", label: "Added" };
    case "updated":
      return { bgcolor: "#eff6ff", color: "#2563eb", label: "Updated" };
    case "removed":
      return { bgcolor: "#fef2f2", color: "#dc2626", label: "Removed" };
    case "conflict":
      return { bgcolor: "#fffbeb", color: "#d97706", label: "Conflict" };
    case "kept":
      return { bgcolor: "#f4f4f5", color: "#71717a", label: "Kept" };
    case "unchanged":
    default:
      return { bgcolor: "#f4f4f5", color: "#71717a", label: "Unchanged" };
  }
}

export function ImportSummary({ preview }: { preview: SchemaImportPreview }) {
  const isNoChanges =
    preview.counts.added === 0 &&
    preview.counts.updated === 0 &&
    preview.counts.removed === 0 &&
    preview.counts.detached === 0;

  return (
    <Stack spacing={2}>
      {/* 5-Column Metrics Grid */}
      <Box
        sx={{
          border: "1px solid #e4e4e7",
          borderRadius: 2,
          bgcolor: "#ffffff",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          overflow: "hidden",
        }}
      >
        {[
          { count: preview.counts.added, label: "Added", tag: "added" },
          { count: preview.counts.updated, label: "Updated", tag: "updated" },
          { count: preview.counts.removed, label: "Removed", tag: "removed" },
          { count: preview.counts.unchanged + preview.counts.kept, label: "Unchanged", tag: "kept" },
          { count: preview.counts.detached, label: "Groups detached", tag: "groups detached" },
        ].map((item, idx) => (
          <Box
            key={item.label}
            sx={{
              p: 2,
              borderRight: idx < 4 ? "1px solid #e4e4e7" : "none",
              textAlign: "left",
            }}
          >
            <Typography sx={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.2, color: "#18181b" }}>
              {item.count}
            </Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "#71717a", mt: 0.5 }}>
              {item.label}
            </Typography>
            <span style={srOnly}>
              {item.count} {item.tag}
            </span>
          </Box>
        ))}
      </Box>

      {/* Info / Alert Banners */}
      {isNoChanges && (
        <Box
          sx={{
            bgcolor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 2,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <InfoOutlinedIcon sx={{ color: "#3b82f6", fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: "#1e40af" }}>
            Your catalog already matches the repo. Applying won’t change anything.
          </Typography>
        </Box>
      )}

      {preview.mode === "refresh" && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Refreshing schemas will update matching schemas in place and add new repository schemas. Existing schemas are
          preserved.
        </Alert>
      )}

      {preview.mode === "replace" && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Replacing the schema catalog will overwrite existing schemas with the repository versions, archive removed
          schemas, and detach unmapped record groups.
          {preview.counts.removed > 0 &&
            ` ${preview.counts.removed} existing schema${preview.counts.removed === 1 ? "" : "s"} will be removed.`}
          {preview.counts.detached > 0 &&
            ` ${preview.counts.detached} record group${preview.counts.detached === 1 ? "" : "s"} will be detached.`}
        </Alert>
      )}

      {preview.detached_groups.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {preview.detached_groups.length} record{" "}
          {preview.detached_groups.length === 1 ? "group will" : "groups will"} be left without a schema. Their records
          and stored fields are preserved. Schema-dependent cleaning and document processing will be unavailable.
        </Alert>
      )}

      <ImportGroups groups={preview.affected_groups} label="Affected record groups across all teams" />
      <ImportGroups groups={preview.detached_groups} label="Record groups to detach" />
    </Stack>
  );
}

interface ReviewProps {
  preview: SchemaImportPreview;
  decisions: Record<string, SchemaImportDecision>;
  canReplace: boolean;
  disabled: boolean;
  onDecision: (id: string, decision: SchemaImportDecision) => void;
  onDecideAll: (action: "keep" | "replace") => void;
  onRecheck?: () => void;
}

export default function SchemaImportReview({
  preview,
  decisions,
  canReplace,
  disabled,
  onDecision,
  onDecideAll,
  onRecheck,
}: ReviewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (preview.entries.length > 0) {
      initial[preview.entries[0].source_id] = true;
    }
    return initial;
  });
  const [showComparison, setShowComparison] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleComparison = (id: string) => {
    setShowComparison((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const summaryCountText =
    preview.counts.unchanged + preview.counts.kept === preview.entries.length
      ? `${preview.entries.length} unchanged`
      : `${preview.entries.length} schemas`;

  return (
    <Stack spacing={2.5}>
      {/* Summary Header & Re-run button */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b" }}>Summary</Typography>
          {onRecheck && (
            <Button
              startIcon={<RefreshIcon />}
              onClick={onRecheck}
              disabled={disabled}
              aria-label="Update preview"
              size="small"
            >
              Re-run preview
            </Button>
          )}
        </Stack>

        <ImportSummary preview={preview} />
      </Box>

      {/* Errors */}
      {preview.errors.map((message) => (
        <Alert key={message} severity="error" sx={{ borderRadius: 2 }}>
          {message}
        </Alert>
      ))}

      {/* Conflict Resolution Banner in Add mode */}
      {preview.mode === "add" && preview.counts.conflict > 0 && (
        <Alert
          severity="warning"
          sx={{ borderRadius: 2 }}
          action={
            <Stack direction="row" spacing={1} sx={{ mt: { xs: 1, sm: 0 } }}>
              {canReplace && (
                <Button
                  size="small"
                  color="inherit"
                  variant="outlined"
                  disabled={disabled}
                  onClick={() => onDecideAll("replace")}
                >
                  Use repo version for all
                </Button>
              )}
              <Button
                size="small"
                color="inherit"
                variant="outlined"
                disabled={disabled}
                onClick={() => onDecideAll("keep")}
              >
                Keep existing for all
              </Button>
            </Stack>
          }
        >
          Resolve each conflict, then update the preview. Nothing is applied until the final confirmation.
        </Alert>
      )}

      {/* Schemas List Section */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b" }}>Schemas</Typography>
          <Typography variant="body2" sx={{ color: "#71717a" }}>
            {summaryCountText}
          </Typography>
        </Stack>

        <Box
          sx={{
            border: "1px solid #e4e4e7",
            borderRadius: 2,
            bgcolor: "#ffffff",
            overflow: "hidden",
          }}
        >
          {preview.entries.map((entry) => {
            const isExpanded = !!expanded[entry.source_id];
            const isComparing = !!showComparison[entry.source_id];
            const decision = decisions[entry.source_id];
            const target = decision?.schema_id || (entry.candidates.length === 1 ? entry.candidates[0].schema_id : "");
            const candidate = entry.candidates.find((item) => item.schema_id === target);
            const groups = candidate?.groups || entry.groups;
            const status = getStatusStyle(decision?.action || entry.action);
            const diff = candidate?.diff || entry.diff;
            const diffDesc = getDiffDescription(diff);
            const fieldCount = (candidate as { field_count?: number })?.field_count;

            return (
              <Box key={entry.source_id} sx={{ borderBottom: "1px solid #f4f4f5" }}>
                {/* Summary Row */}
                <Box
                  onClick={() => toggleExpand(entry.source_id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#fafafa" },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {isExpanded ? (
                      <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#71717a" }} />
                    ) : (
                      <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "#71717a" }} />
                    )}
                    <Typography
                      sx={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.875rem", color: "#18181b" }}
                    >
                      {entry.name}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" sx={{ color: "#71717a" }}>
                      {groups.length > 0
                        ? `${groups.length} record group${groups.length === 1 ? "" : "s"}`
                        : "No record groups"}
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 3,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        bgcolor: status.bgcolor,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </Box>
                  </Stack>
                </Box>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <Box sx={{ bgcolor: "#fafafa", p: 2.5, borderTop: "1px solid #f4f4f5" }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={3}
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      {/* Left Column: Fields & Processor */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#71717a",
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            mb: 0.75,
                          }}
                        >
                          FIELDS & PROCESSOR
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#18181b" }}>
                          {fieldCount !== undefined ? `${fieldCount} fields · ` : ""}
                          {diffDesc}
                        </Typography>
                        {diff && (
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => toggleComparison(entry.source_id)}
                            sx={{
                              color: "#18181b",
                              display: "inline-block",
                              mt: 0.75,
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            {isComparing ? "Hide comparison" : "View full comparison"}
                          </Link>
                        )}
                        {isComparing && diff && <FieldDiff diff={diff} />}
                      </Box>

                      {/* Right Column: Record Groups Using It */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#71717a",
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            mb: 0.75,
                          }}
                        >
                          RECORD GROUPS USING IT
                        </Typography>
                        {groups.length === 0 ? (
                          <Typography variant="body2" sx={{ color: "#71717a" }}>
                            None
                          </Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            {groups.map((g) => (
                              <Typography key={g.id} variant="body2" sx={{ color: "#18181b" }}>
                                {g.name}
                                {g.team ? ` · ${g.team}` : ""}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    {/* Decision selector for conflicts in Add mode */}
                    {preview.mode === "add" && entry.candidates.length > 0 && entry.action !== "unchanged" && (
                      <Stack spacing={2} sx={{ mt: 2.5, pt: 2, borderTop: "1px solid #e4e4e7" }}>
                        {entry.candidates.length > 1 && (
                          <TextField
                            select
                            size="small"
                            label={`Existing schema for ${entry.name}`}
                            value={target}
                            disabled={disabled}
                            onChange={(event) =>
                              onDecision(entry.source_id, {
                                action: decision?.action || "keep",
                                schema_id: event.target.value,
                              })
                            }
                          >
                            {entry.candidates.map((item) => (
                              <MenuItem key={item.schema_id} value={item.schema_id}>
                                {item.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                        <TextField
                          select
                          size="small"
                          label={`Decision for ${entry.name}`}
                          value={decision?.action || ""}
                          disabled={disabled}
                          onChange={(event) =>
                            onDecision(entry.source_id, {
                              action: event.target.value as SchemaImportDecision["action"],
                              schema_id: target,
                            })
                          }
                        >
                          <MenuItem value="keep">Keep existing</MenuItem>
                          {canReplace && <MenuItem value="replace">Use repo version</MenuItem>}
                        </TextField>
                        {!canReplace && (
                          <Typography variant="body2" sx={{ color: "#71717a" }}>
                            An administrator must approve replacing an existing schema.
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Schemas to remove in Replace mode */}
          {preview.removed.map((schema) => (
            <Box
              key={schema.schema_id}
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #f4f4f5",
              }}
            >
              <Typography sx={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.875rem", color: "#dc2626" }}>
                {schema.name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" sx={{ color: "#71717a" }}>
                  {schema.groups.length > 0
                    ? `${schema.groups.length} record group${schema.groups.length === 1 ? "" : "s"}`
                    : "No record groups"}
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.25,
                    borderRadius: 3,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    bgcolor: "#fef2f2",
                    color: "#dc2626",
                  }}
                >
                  Removed
                </Box>
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
