import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { addRecordGroup, getProcessors } from "../../services/app.service";
import { callAPI, convertToMongoProcessor } from "../../util";
import { MongoProcessor } from "../../types";
import SchemaOptions, { schemaSelectionKey } from "../ConnectProcessorDialog/SchemaOptions";

interface NewRecordGroupDialogProps {
  open: boolean;
  onClose: () => void;
  project_id: string;
}

export default function NewRecordGroupDialog({ open, onClose, project_id }: NewRecordGroupDialogProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schemas, setSchemas] = useState<MongoProcessor[]>([]);
  const [selected, setSelected] = useState<MongoProcessor>();
  const [databaseMode, setDatabaseMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setSelected(undefined);
    setError(undefined);
    callAPI(getProcessors, [], data => {
      if (!active) return;
      setDatabaseMode(data.USE_DB_PROCESSORS);
      setSchemas(data.processor_list.map(convertToMongoProcessor));
      setLoading(false);
    }, message => { if (active) { setError(String(message)); setLoading(false); } });
    return () => { active = false; };
  }, [open]);

  const create = async () => {
    setSaving(true);
    setError(undefined);
    const binding = databaseMode ? { schema_id: selected?.schema_id || null } : { processorId: selected?.processorId || null };
    await callAPI(addRecordGroup, [{ name: name.trim(), description, project_id, ...binding,
      documentType: selected?.documentType || selected?.name || "Unspecified" }],
    id => navigate(`/record_group/${id}`), message => setError(String(message)));
    setSaving(false);
  };
  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" data-cy="new-record-group-dialog">
    <DialogTitle>New Record Group</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Record Group Name" value={name} onChange={event => setName(event.target.value)} disabled={saving} data-cy="record-group-name-input" />
      <TextField label="Description" value={description} onChange={event => setDescription(event.target.value)} disabled={saving} multiline rows={3} data-cy="record-group-description-input" />
      <Typography>{databaseMode ? "Select a shared schema (optional)" : "Select a processor (optional)"}</Typography>
      {loading ? <CircularProgress aria-label="Loading schemas" /> : <SchemaOptions schemas={schemas}
        selected={selected ? schemaSelectionKey(selected) : ""} onSelect={schema => setSelected(selected && schemaSelectionKey(selected) === schemaSelectionKey(schema) ? undefined : schema)}
        disabled={saving} databaseMode={databaseMode} selector="processor-option" />}
      <Typography variant="body2">You can import JSON/CSV records without a processor. Document processing requires a processor ID and model ID.</Typography>
    </Stack></DialogContent>
    <DialogActions><Button disabled={saving} onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={create} disabled={saving || loading || !name.trim()} data-cy="create-record-group-button">{saving ? "Creating…" : "Create Record Group"}</Button>
    </DialogActions>
  </Dialog>;
}
