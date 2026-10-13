import { useEffect, useState } from "react";
import { applyRepoSchemaImport, getRepoSchemaImport, previewRepoSchemaImport } from "../../services/app.service";
import { RepoSchemaImportSource, SchemaImportDecision, SchemaImportPreview } from "../../types";
import { callAPI } from "../../util";

export default function useSchemaImport(onApplied: () => void, canReplace = true) {
  const [source, setSource] = useState<RepoSchemaImportSource>();
  const [mode, setMode] = useState<"refresh" | "add" | "replace">(canReplace ? "refresh" : "add");
  const [selected, setSelected] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, SchemaImportDecision>>({});
  const [preview, setPreview] = useState<SchemaImportPreview>();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canReplace && mode !== "add") {
      setMode("add");
    }
  }, [canReplace, mode]);

  useEffect(() => {
    let active = true;
    setBusy(true);
    callAPI(getRepoSchemaImport, [], (data: RepoSchemaImportSource) => {
      if (!active) return;
      setSource(data);
      setSelected(data.schemas.filter(schema => !schema.error).map(schema => schema.source_id));
      setBusy(false);
    }, message => { if (active) { setError(String(message)); setBusy(false); } });
    return () => { active = false; };
  }, []);

  const review = async () => {
    setBusy(true);
    setError("");
    await callAPI(previewRepoSchemaImport, [{ mode, selected, decisions }], (data: SchemaImportPreview) => {
      setPreview(data);
      setDirty(false);
      setStep(1);
    }, message => setError(String(message)));
    setBusy(false);
  };

  const apply = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    await callAPI(applyRepoSchemaImport, [preview.import_id], (data: SchemaImportPreview) => {
      setPreview(data);
      if (data.status === "complete") onApplied();
    }, (message, status) => {
      setError(String(message));
      if (status === 409 && preview.status === "preview") { setDirty(true); setStep(1); }
    });
    setBusy(false);
  };

  const resume = () => {
    if (!source?.pending_import) return;
    setPreview(source.pending_import);
    setMode(source.pending_import.mode);
    setStep(2);
  };

  const decideAll = (action: "keep" | "replace") => {
    if (!preview) return;
    const next: Record<string, SchemaImportDecision> = { ...decisions };
    preview.entries.forEach(entry => {
      if (entry.candidates.length > 0 && entry.action !== "unchanged") {
        const target = next[entry.source_id]?.schema_id || entry.candidates[0].schema_id;
        next[entry.source_id] = { action, schema_id: target };
      }
    });
    setDecisions(next);
    setDirty(true);
  };

  return {
    source, mode, selected, decisions, preview, step, busy, dirty, error, review, apply, resume, setStep, decideAll,
    chooseMode: (value: "refresh" | "add" | "replace") => { setMode(value); setDecisions({}); setDirty(true); },
    chooseSchema: (id: string) => {
      setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
      setDecisions({}); setDirty(true);
    },
    decide: (id: string, decision: SchemaImportDecision) => { setDecisions(previous => ({ ...previous, [id]: decision })); setDirty(true); },
  };
}
