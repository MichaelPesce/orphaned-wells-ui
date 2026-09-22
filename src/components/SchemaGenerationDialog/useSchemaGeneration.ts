import { useEffect, useState } from "react";
import { applyRecordGroupSchema, getCleaningFunctions, previewRecordGroupSchema } from "../../services/app.service";
import { RecordGroup, SchemaField, SchemaGenerationPreview, SchemaGenerationRequest } from "../../types";
import { callAPI } from "../../util";

export default function useSchemaGeneration(groupId: string, mode: "generate" | "extend", onApplied: (group: RecordGroup) => void) {
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState<SchemaGenerationPreview>();
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [cleaningFunctions, setCleaningFunctions] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [retryRequest, setRetryRequest] = useState<SchemaGenerationRequest>();

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    setPreview(undefined);
    setRetryRequest(undefined);
    setEditing(false);
    Promise.all([
      callAPI(previewRecordGroupSchema, [groupId, mode], (data: SchemaGenerationPreview) => {
        if (!active) return;
        setPreview(data);
        setFields(data.fields);
        setName(data.name);
        setDocumentType(data.documentType);
      }, message => { if (active) setError(String(message)); }),
      callAPI(getCleaningFunctions, [], (data: { cleaning_functions: string[] }) => {
        if (active) setCleaningFunctions(data.cleaning_functions);
      }, message => { if (active) setError(String(message)); }),
    ]).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [groupId, mode, attempt]);

  const editField = async (_processor: string, fieldName: string, updates: Record<string, string | number | null>) => {
    setFields(previous => previous.map(field => field.name === fieldName ? { ...field, ...Object.fromEntries(Object.entries(updates).map(([key, value]) => [key, value === null ? undefined : value])) } : field));
    return true;
  };

  const apply = async () => {
    if (!preview || busy || editing) return;
    const request = retryRequest || {
      preview_id: preview.preview_id, fields,
      ...(mode === "generate" ? { name: name.trim(), documentType: documentType.trim() } : {}),
    };
    setBusy(true);
    setError("");
    await callAPI(applyRecordGroupSchema, [groupId, request], onApplied, (message, status) => {
      setError(String(message));
      // A lost response may follow a successful write. Retry the exact request.
      if (!status || status >= 500) setRetryRequest(request);
    });
    setBusy(false);
  };

  return { preview, fields, name, documentType, cleaningFunctions, busy, error, editing, retryRequest,
    setName, setDocumentType, setEditing, editField, apply,
    refresh: () => setAttempt(previous => previous + 1),
  };
}
