import React from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import { useUserContext } from "../../usercontext";
import SchemaImportReview, { ImportGroups } from "./SchemaImportReview";
import useSchemaImport from "./useSchemaImport";

function SchemaImportStepper({ step, completed }: { step: number; completed: boolean }) {
  const steps = ["Choose", "Review", "Apply"];

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
      {steps.map((label, idx) => {
        const isCompleted = completed || step > idx;
        const isActive = !completed && step === idx;

        return (
          <React.Fragment key={label}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isCompleted || isActive ? "#18181b" : "#fff",
                  border: isCompleted || isActive ? "none" : "1.5px solid #d4d4d8",
                  color: isCompleted || isActive ? "#fff" : "#71717a",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {isCompleted ? <CheckIcon sx={{ fontSize: 13 }} /> : idx + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: isCompleted || isActive ? 600 : 400,
                  color: isCompleted || isActive ? "#18181b" : "#71717a",
                }}
              >
                {label}
              </Typography>
            </Stack>
            {idx < steps.length - 1 && (
              <Box sx={{ width: 28, height: "1px", bgcolor: "#e4e4e7", mx: 1 }} />
            )}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}

export default function SchemaImportDialog({
  onClose,
  onApplied,
}: {
  onClose: () => void;
  onApplied: () => void;
}) {
  const { hasPermission } = useUserContext();
  const canReplace = hasPermission("manage_schema_destructive");
  const flow = useSchemaImport(onApplied, canReplace);
  const { source, mode, selected, decisions, preview, step, busy, dirty, error } = flow;
  const completed = preview?.status === "complete";
  const started = preview && preview.status !== "preview";
  const sourceInfo = preview?.source || source?.source;
  const missingTarget = Object.values(decisions).some(decision => !decision.schema_id);
  const effectiveMode = preview?.mode || mode;
  const applyLabel =
    preview?.status === "partial" || preview?.status === "applying"
      ? "Resume import"
      : effectiveMode === "refresh"
      ? "Refresh schemas from repo"
      : effectiveMode === "replace"
      ? `Replace schemas${preview?.counts.detached ? ` and detach ${preview.counts.detached} group${preview.counts.detached === 1 ? "" : "s"}` : ""}`
      : "Import selected schemas";

  const getTitle = () => {
    if (step === 0) return "Import schemas";
    if (step === 1) return "Review changes";
    return "Apply to shared catalog?";
  };

  const getSubtitle = () => {
    if (step === 0) {
      return "Shared with all teams. Imports are a one-time copy and won’t update when the package changes.";
    }
    const modeName =
      effectiveMode === "refresh"
        ? "Sync with repo"
        : effectiveMode === "replace"
        ? "Replace catalog"
        : "Add new schemas";
    const sourceName =
      sourceInfo?.type === "github"
        ? `GitHub ${sourceInfo.repo || "CATALOG-Historic-Records/OGRRE_data_cleaning"} @ ${sourceInfo.ref || "main"}${sourceInfo.collaborator ? ` · ${sourceInfo.collaborator}` : ""}`
        : `${sourceInfo?.package || "ogrre_data_cleaning"}${sourceInfo?.version ? ` v${sourceInfo.version.replace(/^v/, "")}` : ""}${sourceInfo?.collaborator ? ` · ${sourceInfo.collaborator}` : ""}`;
    return `${modeName} from ${sourceName}`;
  };

  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="schema-import-title"
      data-cy="schema-import-dialog"
      PaperProps={{
        sx: {
          borderRadius: "12px",
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Dialog Header */}
      <Box sx={{ p: "20px 24px 16px 24px" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              id="schema-import-title"
              sx={{ fontSize: "1.25rem", fontWeight: 700, color: "#18181b", lineHeight: 1.2 }}
            >
              {getTitle()}
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "#71717a", mt: 0.5 }}>
              {getSubtitle()}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            sx={{ color: "#71717a", mt: -0.5, mr: -0.5 }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>

        <SchemaImportStepper step={step} completed={!!completed} />
      </Box>

      {/* Loading Bar */}
      <Box sx={{ width: "100%", height: 3 }}>
        {busy && (
          <LinearProgress
            aria-label="Loading import"
            sx={{
              height: 3,
              bgcolor: "#f4f4f5",
              "& .MuiLinearProgress-bar": { bgcolor: "#18181b" },
            }}
          />
        )}
      </Box>

      <Box sx={{ borderBottom: "1px solid #e4e4e7" }} />

      {/* Dialog Content */}
      <DialogContent sx={{ p: "20px 24px", overflowY: "auto", maxHeight: "calc(80vh - 140px)" }}>
        <Stack spacing={2.5}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          {step === 0 && source && (
            <>
              {source.error && <Alert severity="error" sx={{ borderRadius: 2 }}>{source.error}</Alert>}
              {source.busy && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  A schema update is in progress. Close and reopen this dialog to refresh its status.
                </Alert>
              )}
              {source.pending_import ? (
                <Alert
                  severity="warning"
                  sx={{ borderRadius: 2 }}
                  action={
                    <Button color="inherit" size="small" disabled={busy || source.busy} onClick={flow.resume}>
                      Review saved import
                    </Button>
                  }
                >
                  An import is unfinished. Review its saved changes and resume it before starting another import.
                </Alert>
              ) : (
                <>
                  {/* Source Section */}
                  <Box>
                    <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#18181b", mb: 1 }}>
                      Source
                    </Typography>

                    {/* Segmented control */}
                    <Box sx={{ display: "inline-flex", p: "3px", bgcolor: "#f4f4f5", borderRadius: "8px", mb: 1.5 }}>
                      <RadioGroup
                        row
                        value={flow.sourceType}
                        onChange={event => flow.changeSourceType(event.target.value as "installed" | "github")}
                        aria-label="Schema source type"
                        sx={{ display: "flex", gap: 0.5 }}
                      >
                        <Box
                          component="label"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            position: "relative",
                            cursor: busy ? "not-allowed" : "pointer",
                            px: 2,
                            py: 0.6,
                            borderRadius: "6px",
                            bgcolor: flow.sourceType === "installed" ? "#fff" : "transparent",
                            color: flow.sourceType === "installed" ? "#18181b" : "#71717a",
                            fontWeight: flow.sourceType === "installed" ? 600 : 500,
                            boxShadow: flow.sourceType === "installed" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                            fontSize: "0.875rem",
                            userSelect: "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Radio
                            value="installed"
                            size="small"
                            disabled={busy}
                            inputProps={{ "aria-label": "Installed package" }}
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              m: 0,
                              p: 0,
                              opacity: 0,
                              cursor: busy ? "not-allowed" : "pointer",
                              zIndex: 1,
                            }}
                          />
                          Installed package
                        </Box>
                        <Box
                          component="label"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            position: "relative",
                            cursor: busy ? "not-allowed" : "pointer",
                            px: 2,
                            py: 0.6,
                            borderRadius: "6px",
                            bgcolor: flow.sourceType === "github" ? "#fff" : "transparent",
                            color: flow.sourceType === "github" ? "#18181b" : "#71717a",
                            fontWeight: flow.sourceType === "github" ? 600 : 500,
                            boxShadow: flow.sourceType === "github" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                            fontSize: "0.875rem",
                            userSelect: "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Radio
                            value="github"
                            size="small"
                            disabled={busy}
                            inputProps={{ "aria-label": "GitHub branch or commit" }}
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              m: 0,
                              p: 0,
                              opacity: 0,
                              cursor: busy ? "not-allowed" : "pointer",
                              zIndex: 1,
                            }}
                          />
                          GitHub branch or commit
                        </Box>
                      </RadioGroup>
                    </Box>

                    {/* Source Details Card */}
                    {flow.sourceType === "installed" ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: "10px 14px",
                          border: "1px solid #e4e4e7",
                          borderRadius: "8px",
                          bgcolor: "#fff",
                        }}
                      >
                        <WidgetsOutlinedIcon sx={{ fontSize: 18, color: "#52525b" }} />
                        <Typography sx={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.875rem", color: "#18181b" }}>
                          {sourceInfo?.package || "ogrre_data_cleaning"}
                        </Typography>
                        {sourceInfo?.version && (
                          <Box
                            sx={{
                              bgcolor: "#f4f4f5",
                              borderRadius: "12px",
                              px: 1,
                              py: 0.25,
                              fontSize: "0.75rem",
                              color: "#71717a",
                              fontFamily: "monospace",
                            }}
                          >
                            v{sourceInfo.version.replace(/^v/, "")}
                          </Box>
                        )}
                        {sourceInfo?.collaborator && (
                          <Box
                            sx={{
                              bgcolor: "#f4f4f5",
                              borderRadius: "12px",
                              px: 1,
                              py: 0.25,
                              fontSize: "0.75rem",
                              color: "#71717a",
                            }}
                          >
                            {sourceInfo.collaborator}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ p: 2, border: "1px solid #e4e4e7", borderRadius: "8px", bgcolor: "#fff" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <TextField
                            size="small"
                            label="Branch, tag, or commit"
                            value={flow.ref}
                            onChange={e => flow.setRef(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && flow.ref.trim() && flow.repo.trim() && !busy) {
                                flow.loadRemoteSource(flow.ref, flow.repo);
                              }
                            }}
                            disabled={busy}
                            sx={{ width: 220 }}
                          />
                          <TextField
                            size="small"
                            label="GitHub Repository"
                            value={flow.repo}
                            onChange={e => flow.setRepo(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && flow.ref.trim() && flow.repo.trim() && !busy) {
                                flow.loadRemoteSource(flow.ref, flow.repo);
                              }
                            }}
                            disabled={busy}
                            sx={{ flexGrow: 1 }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={busy || !flow.ref.trim() || !flow.repo.trim()}
                            onClick={() => flow.loadRemoteSource(flow.ref, flow.repo)}
                          >
                            Fetch
                          </Button>
                        </Stack>
                        {sourceInfo && (
                          <Typography variant="body2" sx={{ color: "#71717a", fontSize: "0.8125rem", mt: 1.5 }}>
                            {`GitHub ${sourceInfo.repo || "CATALOG-Historic-Records/OGRRE_data_cleaning"} @ ${sourceInfo.ref || "main"} · ${sourceInfo.collaborator}`}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Mode Selection Cards */}
                  <Box>
                    <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#18181b", mb: 1.5 }}>
                      How should existing schemas be handled?
                    </Typography>
                    <RadioGroup
                      value={mode}
                      onChange={event => flow.chooseMode(event.target.value as "refresh" | "add" | "replace")}
                      aria-label="Import mode"
                      sx={{ gap: 1 }}
                    >
                      {[
                        {
                          value: "refresh" as const,
                          title: "Sync with repo",
                          recommended: true,
                          description:
                            "Updates matching schemas, adds new ones, and removes unused ones. Schemas with record groups attached are always kept.",
                          label: "Refresh from repo (recommended)",
                          disabled: busy || !canReplace,
                        },
                        {
                          value: "add" as const,
                          title: "Add new only",
                          recommended: false,
                          description: "Adds schemas that don’t exist yet. Existing schemas are left unchanged.",
                          label: "Add to existing schemas",
                          disabled: busy,
                        },
                        {
                          value: "replace" as const,
                          title: "Replace catalog",
                          recommended: false,
                          description:
                            "Removes every schema not in this import, then imports the selection. Attached record groups will be detached if their schema is removed.",
                          label: "Replace the schema catalog",
                          disabled: busy || !canReplace,
                        },
                      ].map(card => {
                        const isSelected = mode === card.value;
                        return (
                          <Box
                            component="label"
                            key={card.value}
                            onClick={() => !card.disabled && flow.chooseMode(card.value)}
                            sx={{
                              display: "block",
                              position: "relative",
                              p: "14px 16px",
                              border: isSelected ? "1.5px solid #18181b" : "1px solid #e4e4e7",
                              borderRadius: "8px",
                              bgcolor: "#fff",
                              cursor: card.disabled ? "not-allowed" : "pointer",
                              opacity: card.disabled ? 0.5 : 1,
                              transition: "all 0.15s ease",
                              "&:hover": {
                                borderColor: isSelected ? "#18181b" : card.disabled ? "#e4e4e7" : "#a1a1aa",
                              },
                            }}
                          >
                            <Radio
                              value={card.value}
                              checked={isSelected}
                              disabled={card.disabled}
                              inputProps={{ "aria-label": card.label }}
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                m: 0,
                                p: 0,
                                opacity: 0,
                                cursor: card.disabled ? "not-allowed" : "pointer",
                                zIndex: 1,
                              }}
                            />
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b" }}>
                                {card.title}
                              </Typography>
                              {card.recommended && (
                                <Box
                                  sx={{
                                    bgcolor: "#18181b",
                                    color: "#fff",
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    borderRadius: "10px",
                                    px: 1,
                                    py: "1px",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  Recommended
                                </Box>
                              )}
                            </Stack>
                            <Typography sx={{ fontSize: "0.8125rem", color: "#71717a", mt: 0.5, lineHeight: 1.4 }}>
                              {card.description}
                            </Typography>
                          </Box>
                        );
                      })}
                    </RadioGroup>
                  </Box>

                  {/* Schemas to Import Table */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#18181b" }}>
                        Schemas to import
                      </Typography>
                      <Typography sx={{ fontSize: "0.8125rem", color: "#71717a" }}>
                        {selected.length} of {source.schemas.length} selected
                      </Typography>
                    </Stack>
                    <Box sx={{ border: "1px solid #e4e4e7", borderRadius: "8px", overflow: "hidden" }}>
                      <Box
                        sx={{
                          bgcolor: "#fafafa",
                          borderBottom: "1px solid #e4e4e7",
                          px: 2,
                          py: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Checkbox
                            size="small"
                            checked={selected.length === source.schemas.length && source.schemas.length > 0}
                            indeterminate={selected.length > 0 && selected.length < source.schemas.length}
                            onChange={() => {
                              if (selected.length === source.schemas.length) {
                                source.schemas.forEach(s => {
                                  if (selected.includes(s.source_id)) flow.chooseSchema(s.source_id);
                                });
                              } else {
                                source.schemas.forEach(s => {
                                  if (!selected.includes(s.source_id) && !s.error) flow.chooseSchema(s.source_id);
                                });
                              }
                            }}
                            disabled={busy}
                            inputProps={{ "aria-label": "Select all schemas" }}
                            sx={{ p: 0, color: "#d4d4d8", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#18181b" } }}
                          />
                          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#71717a", letterSpacing: "0.05em" }}>
                            NAME
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#71717a", letterSpacing: "0.05em" }}>
                          FIELDS
                        </Typography>
                      </Box>
                      <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
                        {!source.schemas.length && (
                          <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>
                            This package has no schemas available to import.
                          </Alert>
                        )}
                        {source.schemas.map(schema => {
                          const schemaLabel = `${schema.name}${schema.field_count !== undefined ? ` · ${schema.field_count} fields` : ""}`;
                          return (
                            <Box key={schema.source_id}>
                              <Box
                                component="label"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  px: 2,
                                  py: 1,
                                  borderBottom: "1px solid #f4f4f5",
                                  "&:last-child": { borderBottom: "none" },
                                  cursor: busy || !!schema.error ? "default" : "pointer",
                                  "&:hover": { bgcolor: schema.error ? "transparent" : "#fcfcfc" },
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flexGrow: 1 }}>
                                  <Checkbox
                                    size="small"
                                    checked={selected.includes(schema.source_id)}
                                    onChange={() => flow.chooseSchema(schema.source_id)}
                                    disabled={busy || !!schema.error}
                                    inputProps={{ "aria-label": schemaLabel }}
                                    sx={{
                                      p: 0,
                                      color: "#d4d4d8",
                                      "&.Mui-checked": { color: "#18181b" },
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                      color: schema.error ? "#dc2626" : "#18181b",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {schema.name}
                                  </Typography>
                                </Stack>
                                <Typography sx={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "#71717a", pl: 2 }}>
                                  {schema.field_count ?? "-"}
                                </Typography>
                              </Box>
                              {schema.error && (
                                <Alert severity="error" sx={{ mx: 2, my: 1, py: 0, borderRadius: 1 }}>
                                  {schema.error}
                                </Alert>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}

          {step === 1 && preview && (
            <SchemaImportReview
              preview={preview}
              decisions={decisions}
              canReplace={canReplace}
              disabled={busy}
              onDecision={flow.decide}
              onDecideAll={flow.decideAll}
              onRecheck={flow.review}
            />
          )}

          {step === 2 && preview && (
            <>
              {/* Warning box */}
              <Box
                sx={{
                  bgcolor: "#fef8ee",
                  borderRadius: "8px",
                  p: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <WarningAmberOutlinedIcon sx={{ color: "#d97706", fontSize: 20 }} />
                <Typography sx={{ fontSize: "0.875rem", color: "#92400e", fontWeight: 500 }}>
                  These changes apply to every team using this database.
                </Typography>
              </Box>

              {busy && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Applying schema updates and reconciling affected record groups. Please keep this dialog open...
                </Alert>
              )}

              {completed && <Alert severity="success" sx={{ borderRadius: 2 }}>Schema import complete.</Alert>}
              {preview.error && <Alert severity="error" sx={{ borderRadius: 2 }}>{preview.error}</Alert>}

              {/* What will happen card */}
              <Box>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#18181b", mb: 1.5 }}>
                  What will happen
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #e4e4e7",
                    borderRadius: "8px",
                    overflow: "hidden",
                    bgcolor: "#fff",
                  }}
                >
                  {[
                    { label: "Schemas added", count: preview.counts.added },
                    { label: "Schemas updated", count: preview.counts.updated },
                    { label: "Schemas removed", count: preview.counts.removed },
                    { label: "Record groups detached", count: preview.counts.detached },
                    { label: "Unchanged", count: preview.counts.unchanged + (preview.counts.kept || 0) },
                  ].map((row, idx) => (
                    <Box
                      key={row.label}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: "12px 16px",
                        borderBottom: idx < 4 ? "1px solid #f4f4f5" : "none",
                      }}
                    >
                      <Typography sx={{ fontSize: "0.875rem", color: "#18181b" }}>
                        {row.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "#18181b",
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        {row.count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {preview.detached_groups.length > 0 && (
                <ImportGroups groups={preview.detached_groups} label="Record groups to detach" />
              )}
              {preview.affected_groups.length > 0 && (
                <ImportGroups groups={preview.affected_groups} label="Affected record groups across all teams" />
              )}

              {started && !completed && (
                <Typography variant="body2" sx={{ color: "#71717a" }}>
                  {preview.next_step} of {preview.total_steps} operations completed.
                </Typography>
              )}
            </>
          )}
        </Stack>
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #e4e4e7",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          {step === 0 && source && (
            <Typography sx={{ fontSize: "0.8125rem", color: "#71717a" }}>
              {source.schemas.length} schemas · {source.schemas.reduce((sum, s) => sum + (s.field_count || 0), 0)} fields
            </Typography>
          )}
          {step > 0 && !started && (
            <Button
              startIcon={<ArrowBackIcon />}
              disabled={busy}
              onClick={() => flow.setStep(step - 1)}
            >
              Back
            </Button>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button onClick={onClose} disabled={busy}>
            {completed ? "Done" : started ? "Close" : "Cancel"}
          </Button>
          {step === 0 && !source?.pending_import && (
            <Button
              variant="contained"
              disabled={busy || !selected.length || source?.busy}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
              onClick={flow.review}
              aria-label="Preview import"
            >
              Review changes
            </Button>
          )}
          {step === 1 && (
            <Button
              variant="contained"
              disabled={busy || dirty || !preview?.can_apply || missingTarget}
              onClick={() => flow.setStep(2)}
            >
              Continue
            </Button>
          )}
          {step === 2 && !completed && (
            <Button
              variant="contained"
              color={effectiveMode === "replace" || preview?.counts.detached ? "error" : "primary"}
              disabled={busy || (!!preview?.destructive && !canReplace)}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
              onClick={flow.apply}
              aria-label={applyLabel}
            >
              {preview?.status === "partial" || preview?.status === "applying" ? "Resume import" : "Apply changes"}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
