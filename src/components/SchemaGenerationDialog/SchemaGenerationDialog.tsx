import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TableContainer, TextField, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { RecordGroup } from "../../types";
import SchemaSheet from "../SchemaTable/SchemaSheet";
import useSchemaGeneration from "./useSchemaGeneration";

interface Props {
  group: RecordGroup;
  onClose: () => void;
  onApplied: (group: RecordGroup) => void;
}

export default function SchemaGenerationDialog({ group, onClose, onApplied }: Props) {
  const mode = group.has_schema ? "extend" : "generate";
  const flow = useSchemaGeneration(group._id, mode, onApplied);
  const { preview, fields, busy, error, retryRequest } = flow;
  const title = mode === "generate" ? "Generate schema" : "Add fields to schema";
  const disabled = busy || !!retryRequest;

  return <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="lg" aria-labelledby="schema-generation-title" data-cy="schema-generation-dialog">
    <DialogTitle id="schema-generation-title">{title}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {busy && <CircularProgress size={24} aria-label="Loading schema preview" />}
      {preview && <>
        <Typography>Reviewed {preview.sampled_records} records (maximum {preview.record_limit}). Found {fields.length} {mode === "extend" ? "new " : ""}fields.</Typography>
        <Alert severity="info">{mode === "generate"
          ? "Review and edit the suggestions before creating a shared schema. Records stay unchanged. The schema starts without a processor; an administrator can attach one later."
          : `These additions update ${preview.schema_name || "the shared schema"} for every record group using it. Existing definitions and stored values are preserved.`}</Alert>
        {preview.warnings.map(warning => <Alert key={warning} severity="warning">{warning}</Alert>)}
        {Object.keys(preview.field_notes).length > 0 && <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>Type assumptions ({Object.keys(preview.field_notes).length})</AccordionSummary>
          <AccordionDetails><Stack spacing={1}>{Object.entries(preview.field_notes).map(([name, messages]) => <Typography key={name} variant="body2"><strong>{name}:</strong> {messages.join(" ")}</Typography>)}</Stack></AccordionDetails>
        </Accordion>}
        {fields.length === 0 ? <Alert severity="info">{mode === "extend" ? "No new fields were found in this sample." : "No usable fields were found in this sample."}</Alert> : <>
          {mode === "generate" && <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Schema name" required fullWidth value={flow.name} disabled={disabled} onChange={event => flow.setName(event.target.value)} />
            <TextField label="Document type" required fullWidth value={flow.documentType} disabled={disabled} onChange={event => flow.setDocumentType(event.target.value)} />
          </Stack>}
          <Typography variant="body2">Use Edit to adjust a field, then Save to keep that suggestion in the preview. The final button applies the schema.</Typography>
          <TableContainer sx={{ maxHeight: 480 }}>
            <SchemaSheet readOnly={disabled} allowAdd={false} allowRemove={false} onEditingChange={flow.setEditing}
              processor={{ name: "preview", attributes: fields }} cleaningFunctions={flow.cleaningFunctions} onAttributeChange={flow.editField} />
          </TableContainer>
        </>}
      </>}
    </Stack></DialogContent>
    <DialogActions>
      <Button disabled={busy} onClick={onClose}>Cancel</Button>
      <Button disabled={busy || !!retryRequest} onClick={flow.refresh}>Refresh preview</Button>
      <Button variant="contained" disabled={busy || !preview || !fields.length || flow.editing || (mode === "generate" && (!flow.name.trim() || !flow.documentType.trim()))} onClick={flow.apply}>
        {retryRequest ? "Retry save" : mode === "generate" ? "Create and attach schema" : "Add fields to shared schema"}
      </Button>
    </DialogActions>
  </Dialog>;
}
