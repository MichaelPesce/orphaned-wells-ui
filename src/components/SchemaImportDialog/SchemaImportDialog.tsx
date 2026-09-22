import { Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { useUserContext } from "../../usercontext";
import SchemaImportReview, { ImportSummary } from "./SchemaImportReview";
import useSchemaImport from "./useSchemaImport";

export default function SchemaImportDialog({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const { hasPermission } = useUserContext();
  const canReplace = hasPermission("manage_schema_destructive");
  const flow = useSchemaImport(onApplied);
  const { source, mode, selected, decisions, preview, step, busy, dirty, error } = flow;
  const completed = preview?.status === "complete";
  const started = preview && preview.status !== "preview";
  const sourceInfo = preview?.source || source?.source;
  const missingTarget = Object.values(decisions).some(decision => !decision.schema_id);
  const applyLabel = preview?.status === "partial" || preview?.status === "applying" ? "Resume import"
    : mode === "replace" ? `Replace schemas${preview?.counts.detached ? ` and detach ${preview.counts.detached} group${preview.counts.detached === 1 ? "" : "s"}` : ""}` : "Import selected schemas";

  return <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="md" aria-labelledby="schema-import-title" data-cy="schema-import-dialog">
    <DialogTitle id="schema-import-title">Import repo schemas</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      <Stepper activeStep={completed ? 3 : step}>{["Choose", "Review", "Apply"].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
      {sourceInfo && <Typography variant="body2">Installed {sourceInfo.package} · {sourceInfo.version} · {sourceInfo.collaborator}</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
      {busy && <CircularProgress size={24} aria-label="Loading import" />}
      {step === 0 && source && <>
        {source.error && <Alert severity="error">{source.error}</Alert>}
        {source.busy && <Alert severity="info">A schema update is in progress. Close and reopen this dialog to refresh its status.</Alert>}
        {source.pending_import ? <Alert severity="warning" action={<Button disabled={busy || source.busy} onClick={flow.resume}>Review saved import</Button>}>
          An import is unfinished. Review its saved changes and resume it before starting another import.
        </Alert> : <>
          <Typography>Imported schemas belong to the database and are shared by all teams. Later package changes do not update them automatically.</Typography>
          <RadioGroup value={mode} onChange={event => flow.chooseMode(event.target.value as "add" | "replace")} aria-label="Import mode">
            <FormControlLabel value="add" control={<Radio />} label="Add to existing schemas" disabled={busy} />
            <FormControlLabel value="replace" control={<Radio />} label="Replace the schema catalog" disabled={busy || !canReplace} />
          </RadioGroup>
          {mode === "replace" && <Alert severity="warning">The catalog will contain only the selected repo schemas. Review all removed schemas and affected record groups before applying.</Alert>}
          {!source.schemas.length && <Alert severity="info">This package has no schemas available to import.</Alert>}
          {source.schemas.map(schema => <Stack key={schema.source_id}>
            <FormControlLabel control={<Checkbox checked={selected.includes(schema.source_id)} onChange={() => flow.chooseSchema(schema.source_id)} disabled={busy || !!schema.error} />}
              label={`${schema.name}${schema.field_count !== undefined ? ` · ${schema.field_count} fields` : ""}`} />
            {schema.error && <Alert severity="error">{schema.error}</Alert>}
          </Stack>)}
        </>}
      </>}
      {step === 1 && preview && <SchemaImportReview preview={preview} decisions={decisions} canReplace={canReplace} disabled={busy} onDecision={flow.decide} />}
      {step === 2 && preview && <>
        {completed ? <Alert severity="success">Schema import complete.</Alert> : <Typography>Confirm these changes to the shared schema catalog. They affect all teams using this database.</Typography>}
        <ImportSummary preview={preview} />
        {preview.error && <Alert severity="error">{preview.error}</Alert>}
        {started && !completed && <Typography variant="body2">{preview.next_step} of {preview.total_steps} operations completed.</Typography>}
      </>}
    </Stack></DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={busy}>{completed ? "Done" : started ? "Close" : "Cancel"}</Button>
      {step > 0 && !started && <Button disabled={busy} onClick={() => flow.setStep(step - 1)}>Back</Button>}
      {step === 0 && !source?.pending_import && <Button variant="contained" disabled={busy || !selected.length || source?.busy} onClick={flow.review}>Preview import</Button>}
      {step === 1 && <>
        <Button disabled={busy || missingTarget} onClick={flow.review}>Update preview</Button>
        <Button variant="contained" disabled={busy || dirty || !preview?.can_apply} onClick={() => flow.setStep(2)}>Continue</Button>
      </>}
      {step === 2 && !completed && <Button variant="contained" color={preview?.destructive ? "error" : "primary"} disabled={busy || (!!preview?.destructive && !canReplace)} onClick={flow.apply}>{applyLabel}</Button>}
    </DialogActions>
  </Dialog>;
}
