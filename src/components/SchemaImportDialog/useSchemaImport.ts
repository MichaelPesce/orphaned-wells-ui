import { useEffect, useState } from "react";
import { applyRepoSchemaImport, getRepoSchemaImport, previewRepoSchemaImport } from "../../services/app.service";
import { RepoSchemaImportSource, SchemaImportDecision, SchemaImportPreview, SchemaImportRequest } from "../../types";
import { callAPI } from "../../util";

const DEFAULT_REPO = "CATALOG-Historic-Records/OGRRE_data_cleaning";
const DEFAULT_REF = "main";

export default function useSchemaImport(onApplied: () => void, canReplace = true) {
  const [source, setSource] = useState<RepoSchemaImportSource>();
  const [sourceType, setSourceType] = useState<"installed" | "github">("installed");
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [ref, setRef] = useState(DEFAULT_REF);
  const [mode, setMode] = useState<"refresh" | "add" | "replace">("refresh");
  const [selected, setSelected] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, SchemaImportDecision>>({});
  const [preview, setPreview] = useState<SchemaImportPreview>();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setBusy(true);
    callAPI(getRepoSchemaImport, [], (data: RepoSchemaImportSource) => {
      if (!active) return;
      setSource(data);
      if (data.source.type) {
        setSourceType(data.source.type);
      }
      if (data.source.ref) {
        setRef(data.source.ref);
      }
      if (data.source.repo) {
        setRepo(data.source.repo);
      }
      setSelected(data.schemas.filter(schema => !schema.error).map(schema => schema.source_id));
      setBusy(false);
    }, message => { if (active) { setError(String(message)); setBusy(false); } });
    return () => { active = false; };
  }, []);

  const fetchSource = async (type: "installed" | "github", branchOrRef = ref, repoName = repo) => {
    setBusy(true);
    setError("");
    const options = type === "github" ? { source_type: type, ref: branchOrRef, repo: repoName } : { source_type: type };
    await callAPI(getRepoSchemaImport, [options], (data: RepoSchemaImportSource) => {
      setSource(data);
      if (data.source.type) {
        setSourceType(data.source.type);
      }
      if (data.source.ref) {
        setRef(data.source.ref);
      }
      if (data.source.repo) {
        setRepo(data.source.repo);
      }
      setSelected(data.schemas.filter(schema => !schema.error).map(schema => schema.source_id));
      setDecisions({});
      setDirty(true);
    }, message => {
      setError(String(message));
    });
    setBusy(false);
  };

  const changeSourceType = async (newType: "installed" | "github") => {
    setSourceType(newType);
    await fetchSource(newType, ref, repo);
  };

  const loadRemoteSource = async (branchOrRef: string, repoName: string) => {
    setRef(branchOrRef);
    setRepo(repoName);
    await fetchSource("github", branchOrRef, repoName);
  };

  const review = async () => {
    setBusy(true);
    setError("");
    const sourcePayload = sourceType === "github"
      ? { type: "github" as const, repo, ref }
      : undefined;
    const requestPayload: SchemaImportRequest = {
      mode,
      selected,
      decisions,
      ...(sourcePayload ? { source: sourcePayload } : {}),
    };
    await callAPI(previewRepoSchemaImport, [requestPayload], (data: SchemaImportPreview) => {
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
    sourceType, repo, ref, setRepo, setRef, changeSourceType, loadRemoteSource,
    chooseMode: (value: "refresh" | "add" | "replace") => { setMode(value); setDecisions({}); setDirty(true); },
    chooseSchema: (id: string) => {
      setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
      setDecisions({}); setDirty(true);
    },
    decide: (id: string, decision: SchemaImportDecision) => { setDecisions(previous => ({ ...previous, [id]: decision })); setDirty(true); },
  };
}
