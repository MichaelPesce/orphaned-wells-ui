import { ProcessingJob } from "../../types";

export const isActiveJob = (job: ProcessingJob) => ["queued", "dispatched", "running"].includes(job.status);
export const jobStatusLabels: Record<ProcessingJob["status"], string> = {
  queued: "Waiting for a worker", dispatched: "Starting worker", running: "Processing",
  completed: "Complete", completed_with_errors: "Completed with errors", error: "Failed",
};
export const jobStages: Record<string, string> = {
  preparing_documents: "Preparing document images", waiting_for_document_ai: "Waiting for Document AI",
  saving_results: "Saving and cleaning results",
};
export const jobTime = (value?: number) => value ? new Date(value * 1000).toLocaleString() : "—";
export const jobDuration = (job: ProcessingJob) => {
  const seconds = Math.max(0, Math.floor((job.completed_at || Date.now() / 1000) - job.created_at));
  return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
};

