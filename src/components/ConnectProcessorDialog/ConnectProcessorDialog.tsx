import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { connectRecordGroupProcessor, getProcessors, updateRecordGroup } from "../../services/app.service";
import { callAPI, convertToMongoProcessor } from "../../util";
import { MongoProcessor, RecordGroup } from "../../types";
import SchemaOptions, { schemaSelectionKey } from "./SchemaOptions";

interface ConnectProcessorDialogProps {
  open: boolean;
  recordGroup: RecordGroup;
  onClose: () => void;
  onConnected: (recordGroup: RecordGroup) => void;
  setErrorMsg: (message: string) => void;
}

export default function ConnectProcessorDialog({ open, recordGroup, onClose, onConnected, setErrorMsg }: ConnectProcessorDialogProps) {
  const [schemas, setSchemas] = useState<MongoProcessor[]>([]);
  const [selected, setSelected] = useState("");
  const [databaseMode, setDatabaseMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(undefined);
    let active = true;
    callAPI(getProcessors, [], data => {
      if (!active) return;
      setSchemas(data.processor_list.map(convertToMongoProcessor));
      setDatabaseMode(data.USE_DB_PROCESSORS);
      setSelected(data.USE_DB_PROCESSORS ? recordGroup.active_schema_id || recordGroup.schema_id || "" : recordGroup.processorId || "");
      setLoading(false);
    }, message => { if (active) { setError(String(message)); setLoading(false); } });
    return () => { active = false; };
  }, [open, recordGroup.active_schema_id, recordGroup.schema_id, recordGroup.processorId]);

  const save = async () => {
    setSubmitting(true);
    setError(undefined);
    const payload = databaseMode ? { schema_id: selected || null } : { processorId: selected };
    await callAPI(databaseMode ? updateRecordGroup : connectRecordGroupProcessor, [recordGroup._id, payload], onConnected,
      message => { setError(String(message)); setErrorMsg(String(message)); });
    setSubmitting(false);
  };

  return <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md" data-cy="connect-processor-dialog">
    <DialogTitle>{databaseMode ? "Select schema" : "Connect processor"}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress aria-label="Loading schemas" /> : <>
        <SchemaOptions schemas={schemas} selected={selected} onSelect={schema => { setSelected(schemaSelectionKey(schema)); setError(undefined); }}
          databaseMode={databaseMode} disabled={submitting} selector="connect-processor-option" />
        {databaseMode && <Button variant={selected ? "outlined" : "contained"} onClick={() => { setSelected(""); setError(undefined); }} disabled={submitting}>No schema</Button>}
        {databaseMode && !selected && <Alert severity="warning">Detaching leaves this record group without a schema. Its records and stored fields are preserved.</Alert>}
        {databaseMode && selected && <Alert severity="info">This selects a shared schema for this record group. Processor settings can be added or changed on the Schema page.</Alert>}
      </>}
    </Stack></DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={submitting}>Cancel</Button>
      <Button variant="contained" data-cy="connect-processor-submit" disabled={submitting || loading || (!databaseMode && !selected)} onClick={save}>
        {submitting ? "Saving…" : databaseMode ? selected ? "Use schema" : "Detach schema" : "Connect processor"}
      </Button>
    </DialogActions>
  </Dialog>;
}
