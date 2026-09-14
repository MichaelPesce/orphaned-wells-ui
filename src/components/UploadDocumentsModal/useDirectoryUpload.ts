import { useEffect, useRef, useState } from "react";
import {
  createDirectoryUpload, createDirectoryFileUpload, finalizeDirectoryUpload, uploadDocument,
} from "../../services/app.service";
import { runWithConcurrency, uploadFileToGcs } from "../../services/gcsUpload.service";
import { DirectoryUploadRequest, DirectoryUploadSession, ProcessingJob } from "../../types";
import { filePath, requestUploadApi } from "./uploadApi";

interface SavedUpload { request: DirectoryUploadRequest; fingerprint: string; expiresAt: number; }

export const useDirectoryUpload = (recordGroupId: string, userEmail: string, setUploading: (value: boolean) => void) => {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [transferred, setTransferred] = useState(0);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [job, setJob] = useState<ProcessingJob>();
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState("");
  const controller = useRef<AbortController>();
  const mounted = useRef(true);
  const saved = useRef<SavedUpload>();
  const storageKey = `directory-upload:${process.env.REACT_APP_BACKEND_URL}:${userEmail}:${recordGroupId}`;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      setUploading(false);
    };
  }, [setUploading]);

  const start = async (selectedFiles: File[], mode: "direct" | "legacy", preventDuplicates: boolean, runCleaningFunctions: boolean) => {
    if (controller.current) return;
    const files = [...selectedFiles].sort((left, right) => filePath(left).localeCompare(filePath(right)));
    const abortController = new AbortController();
    controller.current = abortController;
    setUploading(true);
    setError("");
    setFileErrors([]);
    setProgress(0);
    setTransferred(0);
    const bytes = files.map(() => 0);
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    const failures: string[] = [];
    const updateProgress = (index: number, value: number) => {
      bytes[index] = value;
      if (mounted.current) setProgress(100 * bytes.reduce((total, count) => total + count, 0) / totalBytes);
    };
    try {
      let session: DirectoryUploadSession | undefined;
      if (mode === "direct") {
        setPhase("Preparing upload");
        const manifest = files.map((file) => ({name: file.name, relative_path: filePath(file), size: file.size}));
        const fingerprint = JSON.stringify([manifest, files.map((file) => file.lastModified), preventDuplicates, runCleaningFunctions]);
        try { saved.current = JSON.parse(localStorage.getItem(storageKey) || "null") || saved.current; } catch { /* Storage may be unavailable. */ }
        if (!saved.current || saved.current.fingerprint !== fingerprint || saved.current.expiresAt <= Date.now()) {
          saved.current = {
            request: {
              session_id: crypto.randomUUID().replace(/-/g, ""), files: manifest,
              prevent_duplicates: preventDuplicates, run_cleaning_functions: runCleaningFunctions,
            }, fingerprint, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          };
        }
        // Only metadata is saved. Browser file access must be restored by selecting
        // the directory again after a refresh; GCS session URLs stay in memory.
        try { localStorage.setItem(storageKey, JSON.stringify(saved.current)); } catch { /* In-memory retry still works. */ }
        session = await requestUploadApi<DirectoryUploadSession>(createDirectoryUpload, [recordGroupId, saved.current.request]);
        if (session.job) {
          if (mounted.current) { setJob(session.job); setFinished(true); }
          return;
        }
      }
      setPhase("Transferring files");
      await runWithConcurrency(files, async (file, index) => {
        if (abortController.signal.aborted) throw new Error("Upload paused");
        try {
          if (session) {
            const target = await requestUploadApi<{uploaded: boolean; upload_url?: string}>(createDirectoryFileUpload,
              [recordGroupId, session.session_id, session.files[index].file_id]);
            if (!target.uploaded) {
              if (!target.upload_url) throw new Error("Storage upload authorization is missing");
              await uploadFileToGcs(target.upload_url, file, abortController.signal, (value) => updateProgress(index, value));
            }
          } else {
            const form = new FormData();
            form.append("file", file, file.name);
            await requestUploadApi(uploadDocument, [form, recordGroupId, userEmail, false, preventDuplicates, runCleaningFunctions]);
          }
          updateProgress(index, file.size);
          if (mounted.current) setTransferred((count) => count + 1);
        } catch (failure) {
          failures.push(filePath(file));
          if (mounted.current) setFileErrors([...failures]);
          if (abortController.signal.aborted) throw failure;
        }
      }, mode === "direct" ? 4 : 1);
      if (failures.length) throw new Error("Some files could not be transferred. Retry to continue with the remaining files.");
      if (abortController.signal.aborted) throw new Error("Upload paused");
      if (session) {
        setPhase("Verifying files and starting processing");
        const result = await requestUploadApi<ProcessingJob>(finalizeDirectoryUpload, [recordGroupId, session.session_id]);
        if (mounted.current) setJob(result);
        try { localStorage.removeItem(storageKey); } catch { /* No persisted session to remove. */ }
      }
      if (mounted.current) setFinished(true);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "Unable to upload the directory");
    } finally {
      controller.current = undefined;
      if (mounted.current) { setUploading(false); setPhase(""); }
    }
  };

  return {start, pause: () => controller.current?.abort(), error, progress, transferred, fileErrors, job, finished, phase};
};
