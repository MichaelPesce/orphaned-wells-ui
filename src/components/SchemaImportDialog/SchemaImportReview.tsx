import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SchemaImportDecision, SchemaImportDiff, SchemaImportGroup, SchemaImportPreview } from "../../types";

export function ImportGroups({ groups, label }: { groups: SchemaImportGroup[]; label: string }) {
  if (!groups.length) return null;
  return <Accordion disableGutters elevation={0}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>{label} ({groups.length})</Typography></AccordionSummary>
    <AccordionDetails><Stack spacing={1}>{groups.map(group => <Typography key={group.id} variant="body2">
      {group.name}{group.team ? ` · ${group.team}` : ""}
    </Typography>)}</Stack></AccordionDetails>
  </Accordion>;
}

function FieldDiff({ diff }: { diff: SchemaImportDiff }) {
  const changed = diff.changed.flatMap(field => Array.from(new Set([...Object.keys(field.before), ...Object.keys(field.after)]))
    .filter(key => JSON.stringify((field.before as any)[key]) !== JSON.stringify((field.after as any)[key]))
    .map(key => ({ name: `${field.name} · ${key.replace(/_/g, " ")}`, before: (field.before as any)[key], after: (field.after as any)[key] })));
  const value = (item: unknown) => item == null ? "—" : typeof item === "object" ? JSON.stringify(item) : String(item);
  return <Stack spacing={1}>
    <Typography variant="body2">Added fields: {diff.added.join(", ") || "None"}</Typography>
    <Typography variant="body2">Retired fields: {diff.retired.join(", ") || "None"}</Typography>
    {(changed.length > 0 || diff.metadata.length > 0) && <Table size="small" aria-label="Schema changes">
      <TableHead><TableRow><TableCell>Setting</TableCell><TableCell>Current</TableCell><TableCell>Repo</TableCell></TableRow></TableHead>
      <TableBody>{[...diff.metadata, ...changed].map(item => <TableRow key={item.name}>
        <TableCell sx={{ overflowWrap: "anywhere" }}>{item.name}</TableCell><TableCell sx={{ overflowWrap: "anywhere" }}>{value(item.before)}</TableCell><TableCell sx={{ overflowWrap: "anywhere" }}>{value(item.after)}</TableCell>
      </TableRow>)}</TableBody>
    </Table>}
  </Stack>;
}

export function ImportSummary({ preview }: { preview: SchemaImportPreview }) {
  return <Stack spacing={2}>
    <Stack direction="row" flexWrap="wrap" gap={1}>
      <Chip label={`${preview.counts.added} added`} /><Chip label={`${preview.counts.updated} updated`} />
      <Chip label={`${preview.counts.removed} removed`} /><Chip label={`${preview.counts.unchanged + preview.counts.kept} kept`} />
      <Chip color={preview.counts.detached ? "warning" : "default"} label={`${preview.counts.detached} groups detached`} />
    </Stack>
    {preview.detached_groups.length > 0 && <Alert severity="warning">{preview.detached_groups.length} record {preview.detached_groups.length === 1 ? "group will" : "groups will"} be left without a schema. Their records and stored fields are preserved. Schema-dependent cleaning and document processing will be unavailable.</Alert>}
    <ImportGroups groups={preview.affected_groups} label="Affected record groups across all teams" />
    <ImportGroups groups={preview.detached_groups} label="Record groups to detach" />
  </Stack>;
}

interface ReviewProps {
  preview: SchemaImportPreview;
  decisions: Record<string, SchemaImportDecision>;
  canReplace: boolean;
  disabled: boolean;
  onDecision: (id: string, decision: SchemaImportDecision) => void;
  onDecideAll: (action: "keep" | "replace") => void;
}

export default function SchemaImportReview({ preview, decisions, canReplace, disabled, onDecision, onDecideAll }: ReviewProps) {
  return <Stack spacing={2}>
    <ImportSummary preview={preview} />
    {preview.mode === "refresh" && (
      <Alert severity="info">
        Refreshing schemas will update matching schemas in place and add new repository schemas. Existing schemas in active use are preserved, and unused schemas are pruned.
        {preview.counts.removed > 0 && ` ${preview.counts.removed} unused schema${preview.counts.removed === 1 ? "" : "s"} will be removed.`}
      </Alert>
    )}
    {preview.mode === "replace" && (
      <Alert severity="warning">
        Replacing the schema catalog will overwrite existing schemas with the repository versions, archive removed schemas, and detach unmapped record groups.
        {preview.counts.removed > 0 && ` ${preview.counts.removed} existing schema${preview.counts.removed === 1 ? "" : "s"} will be removed.`}
        {preview.counts.detached > 0 && ` ${preview.counts.detached} record group${preview.counts.detached === 1 ? "" : "s"} will be detached.`}
      </Alert>
    )}
    {preview.errors.map(message => <Alert key={message} severity="error">{message}</Alert>)}
    {preview.mode === "add" && preview.counts.conflict > 0 && (
      <Alert
        severity="warning"
        action={
          <Stack direction="row" spacing={1} sx={{ mt: { xs: 1, sm: 0 } }}>
            {canReplace && (
              <Button size="small" color="inherit" variant="outlined" disabled={disabled} onClick={() => onDecideAll("replace")}>
                Use repo version for all
              </Button>
            )}
            <Button size="small" color="inherit" variant="outlined" disabled={disabled} onClick={() => onDecideAll("keep")}>
              Keep existing for all
            </Button>
          </Stack>
        }
      >
        Resolve each conflict, then update the preview. Nothing is applied until the final confirmation.
      </Alert>
    )}
    {preview.entries.map(entry => {
      const decision = decisions[entry.source_id];
      const target = decision?.schema_id || (entry.candidates.length === 1 ? entry.candidates[0].schema_id : "");
      const candidate = entry.candidates.find(item => item.schema_id === target);
      return <Box key={entry.source_id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={600}>{entry.name}</Typography><Chip size="small" label={entry.action} /></Stack>
        {preview.mode === "add" && entry.candidates.length > 0 && entry.action !== "unchanged" && <Stack spacing={2} sx={{ mt: 2 }}>
          {entry.candidates.length > 1 && <TextField select size="small" label={`Existing schema for ${entry.name}`} value={target} disabled={disabled}
            onChange={event => onDecision(entry.source_id, { action: decision?.action || "keep", schema_id: event.target.value })}>
            {entry.candidates.map(item => <MenuItem key={item.schema_id} value={item.schema_id}>{item.name}</MenuItem>)}
          </TextField>}
          <TextField select size="small" label={`Decision for ${entry.name}`} value={decision?.action || ""} disabled={disabled}
            onChange={event => onDecision(entry.source_id, { action: event.target.value as SchemaImportDecision["action"], schema_id: target })}>
            <MenuItem value="keep">Keep existing</MenuItem>
            {canReplace && <MenuItem value="replace">Use repo version</MenuItem>}
          </TextField>
          {!canReplace && <Typography variant="body2">An administrator must approve replacing an existing schema.</Typography>}
        </Stack>}
        {(candidate?.diff || entry.diff) && <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Compare fields and processor settings</Typography></AccordionSummary>
          <AccordionDetails><FieldDiff diff={(candidate?.diff || entry.diff)!} /></AccordionDetails>
        </Accordion>}
        <ImportGroups groups={candidate?.groups || entry.groups} label="Record groups using this schema" />
      </Box>;
    })}
    {preview.removed.length > 0 && <Accordion disableGutters elevation={0} defaultExpanded={preview.mode === "replace"}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Schemas to remove ({preview.removed.length})</Typography></AccordionSummary>
      <AccordionDetails>{preview.removed.map(schema => <Box key={schema.schema_id} sx={{ mb: 1 }}>
        <Typography>{schema.name}</Typography><ImportGroups groups={schema.groups} label="Record groups" />
      </Box>)}</AccordionDetails>
    </Accordion>}
  </Stack>;
}
