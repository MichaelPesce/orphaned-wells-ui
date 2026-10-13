import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, LinearProgress, Radio, RadioGroup, Stack, Step, StepLabel, Stepper, TextField, Typography } from "@mui/material";
import { useUserContext } from "../../usercontext";
import SchemaImportReview, { ImportSummary } from "./SchemaImportReview";
import useSchemaImport from "./useSchemaImport";

export default function SchemaImportDialog({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const { hasPermission } = useUserContext();
  const canReplace = hasPermission("manage_schema_destructive");
  const flow = useSchemaImport(onApplied, canReplace);
  const { source, mode, selected, decisions, preview, step, busy, dirty, error } = flow;
  const completed = preview?.status === "complete";
  const started = preview && preview.status !== "preview";
  const sourceInfo = preview?.source || source?.source;
  const missingTarget = Object.values(decisions).some(decision => !decision.schema_id);
  const effectiveMode = preview?.mode || mode;
  const applyLabel = preview?.status === "partial" || preview?.status === "applying" ? "Resume import"
    : effectiveMode === "refresh" ? "Refresh schemas from repo"
    : effectiveMode === "replace" ? `Replace schemas${preview?.counts.detached ? ` and detach ${preview.counts.detached} group${preview.counts.detached === 1 ? "" : "s"}` : ""}` : "Import selected schemas";

  return <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="md" aria-labelledby="schema-import-title" data-cy="schema-import-dialog">
    <DialogTitle id="schema-import-title">Import repo schemas</DialogTitle>
    <Box sx={{ width: "100%", height: 4 }}>
      {busy && <LinearProgress aria-label="Loading import" />}
    </Box>
    <DialogContent dividers><Stack spacing={2}>
      <Stepper activeStep={completed ? 3 : step}>{["Choose", "Review", "Apply"].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
      {sourceInfo && (
        <Typography variant="body2">
          {sourceInfo.type === "github"
            ? `GitHub ${sourceInfo.repo || "CATALOG-Historic-Records/OGRRE_data_cleaning"} @ ${sourceInfo.ref || "main"} · ${sourceInfo.collaborator}`
            : `Installed ${sourceInfo.package} · ${sourceInfo.version} · ${sourceInfo.collaborator}`}
        </Typography>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {step === 0 && source && <>
        {source.error && <Alert severity="error">{source.error}</Alert>}
        {source.busy && <Alert severity="info">A schema update is in progress. Close and reopen this dialog to refresh its status.</Alert>}
        {source.pending_import ? <Alert severity="warning" action={<Button disabled={busy || source.busy} onClick={flow.resume}>Review saved import</Button>}>
          An import is unfinished. Review its saved changes and resume it before starting another import.
        </Alert> : <>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Schema Source</Typography>
            <RadioGroup
              row
              value={flow.sourceType}
              onChange={event => flow.changeSourceType(event.target.value as "installed" | "github")}
              aria-label="Schema source type"
            >
              <FormControlLabel value="installed" control={<Radio size="small" />} label="Installed package" disabled={busy} />
              <FormControlLabel value="github" control={<Radio size="small" />} label="GitHub branch or commit" disabled={busy} />
            </RadioGroup>
            {flow.sourceType === "github" && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
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
            )}
          </Box>
          <Typography>Imported schemas belong to the database and are shared by all teams. Later package changes do not update them automatically.</Typography>
          <RadioGroup value={mode} onChange={event => flow.chooseMode(event.target.value as "refresh" | "add" | "replace")} aria-label="Import mode">
            <FormControlLabel value="refresh" control={<Radio />} label="Refresh from repo (recommended)" disabled={busy || !canReplace} />
            <FormControlLabel value="add" control={<Radio />} label="Add to existing schemas" disabled={busy} />
            <FormControlLabel value="replace" control={<Radio />} label="Replace the schema catalog" disabled={busy || !canReplace} />
          </RadioGroup>
          {mode === "refresh" && <Alert severity="info">Matching schemas will be updated in place and new schemas will be added. Schemas with attached record groups are preserved, and unused schemas are pruned.</Alert>}
          {mode === "replace" && <Alert severity="warning">The catalog will contain only the selected repo schemas. Review all removed schemas and affected record groups before applying.</Alert>}
          {!source.schemas.length && <Alert severity="info">This package has no schemas available to import.</Alert>}
          {source.schemas.map(schema => <Stack key={schema.source_id}>
            <FormControlLabel control={<Checkbox checked={selected.includes(schema.source_id)} onChange={() => flow.chooseSchema(schema.source_id)} disabled={busy || !!schema.error} />}
              label={`${schema.name}${schema.field_count !== undefined ? ` · ${schema.field_count} fields` : ""}`} />
            {schema.error && <Alert severity="error">{schema.error}</Alert>}
          </Stack>)}
        </>}
      </>}
      {step === 1 && preview && <SchemaImportReview preview={preview} decisions={decisions} canReplace={canReplace} disabled={busy} onDecision={flow.decide} onDecideAll={flow.decideAll} />}
      {step === 2 && preview && <>
        {busy && <Alert severity="info">Applying schema updates and reconciling affected record groups. Please keep this dialog open...</Alert>}
        {completed ? <Alert severity="success">Schema import complete.</Alert> : <Typography>Confirm these changes to the shared schema catalog. They affect all teams using this database.</Typography>}
        <ImportSummary preview={preview} />
        {preview.error && <Alert severity="error">{preview.error}</Alert>}
        {started && !completed && <Typography variant="body2">{preview.next_step} of {preview.total_steps} operations completed.</Typography>}
      </>}
    </Stack></DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={busy}>{completed ? "Done" : started ? "Close" : "Cancel"}</Button>
      {step > 0 && !started && <Button disabled={busy} onClick={() => flow.setStep(step - 1)}>Back</Button>}
      {step === 0 && !source?.pending_import && <Button variant="contained" disabled={busy || !selected.length || source?.busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={flow.review}>Preview import</Button>}
      {step === 1 && <>
        <Button disabled={busy || missingTarget} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={flow.review}>Update preview</Button>
        <Button variant="contained" disabled={busy || dirty || !preview?.can_apply} onClick={() => flow.setStep(2)}>Continue</Button>
      </>}
      {step === 2 && !completed && <Button variant="contained" color={effectiveMode === "replace" || preview?.counts.detached ? "error" : "primary"} disabled={busy || (!!preview?.destructive && !canReplace)} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={flow.apply}>{applyLabel}</Button>}
    </DialogActions>
  </Dialog>;
}
