# Upload dialog and upload history plan

Status: dialog and history implemented September 14, 2026. This document retains
the original design rationale and estimates. The shipped workflow is documented
in [Uploads and processing](../docs/concepts/upload-processing.mdx).

Implemented: responsive dialog with stable regions, current-submission status,
record-group history with independently paginated active/finished jobs, filters,
paginated file details and record links, guarded retries, and activity timestamps.
The refined dialog is 860px wide and 660px tall, capped at 90dvh; mobile
uses a full-screen dialog. Source tabs and a compact processor menu share the
toolbar, while upload history sits in the footer opposite the primary action. Directory previews use the available body height, between 120px and 240px,
without changing height with the selected file count.

Deferred as scoped: single-file/ZIP submission tracking, retention cleanup, and
operator controls for force-recovering jobs whose worker state is uncertain.

## Problems to solve

- The current upload modal fixes its width at 650px, caps height at 75vh, and
  scrolls the entire container, including navigation and actions.
- Recent jobs initially render nothing, then insert a potentially long list
  when the API responds. The modal expands and recenters.
- The directory file list only has a maximum height, so changing the selected
  count changes the form and modal height.
- Upload configuration, transfer progress, background processing, and older
  jobs compete for the same space. Completed jobs remain visible indefinitely
  among the newest ten, and older active jobs can fall outside that list.

Early queued records and quiet table refresh are a separate implementation.
They let people follow records from the record group after submitting an upload.

## Proposed dialog

Use a MUI `Dialog` with a consistent desktop width around 960px and a body height
bounded by the viewport (for example, a 720px total height capped at 90dvh).
Use a full-screen dialog on small screens. Keep the title/navigation and footer
fixed; scroll the form body and the bounded file list, without nested scrolling
across the entire dialog.

```text
+--------------------------------------------------------------+
| Upload records                          Upload history   Close |
| File / ZIP             Local directory          GCS directory |
+--------------------------------------------------------------+
| Source selection / bucket and path                            |
|                                                              |
| Selected files / preview                                      |
| +----------------------------------------------------------+ |
| | Fixed-height, scrollable list                             | |
| | Loading, empty, errors, and files occupy the same region  | |
| +----------------------------------------------------------+ |
| Count and size     Duplicate prevention     Cleaning          |
+--------------------------------------------------------------+
| Reserved status area: validation / transfer / submitted       |
| Back                                         Upload / Pause  |
+--------------------------------------------------------------+
```

1. Give the file list a fixed responsive height, roughly 240px on desktop.
   Keep its position and dimensions when selecting 1, 10, or 500 files, changing
   upload count, checking duplicates, or receiving errors. Show total files and
   bytes outside the scrolling list; use relative paths with wrapping/tooltips.
2. Reserve space for asynchronous processor/path checks and current-submission
   status. Render loading, empty, success, and error states inside those regions
   immediately. Keep the last useful data visible during subsequent requests.
3. Show only the current submission's concise progress inside the dialog.
   Transfer progress is measured in bytes/files; processing has explicit stages
   and counts. Do not show a determinate processing percentage without supporting
   backend progress data. Link to its records and upload details after submission.
4. Move the growing recent-job list out of the upload form. Keep an always-present
   **Upload history** link in the header, with no conditional insertion that moves
   the form. The first history request must not control dialog geometry.
5. Keep upload options immutable during transfer. Retain Pause and Retry. Once
   transfer/finalization succeeds, allow closing the dialog while processing
   continues. Explain that pause stops transfer and does not cancel a running job.
6. Preserve keyboard focus, Escape behavior, labels, and existing permissions.
   Disable closing while bytes are transferring unless the user deliberately
   pauses. Changing modes should not discard an active transfer silently.

Separate the dialog shell, each source form, the bounded file preview, transfer
status, and footer actions. Reuse `useDirectoryUpload` and the existing GCS
transfer service; place any shared job querying in a hook/service rather than
duplicating polling in each source form.

## Upload history view

Add a record-group route such as `/record_group/:id/uploads`, available from
the record group's `Subheader` actions and the upload dialog. It should remain
usable when no upload is in progress.

- Show an active-uploads section independently of paginated history. Active jobs
  must remain discoverable even after more than ten newer submissions.
- Use a compact table with submitted time, uploader, source type, file count,
  status, succeeded/failed/skipped counts, and duration. Default to newest first.
- Support status, source, uploader, and date filtering using existing filter
  conventions. Use server pagination and trusted record-group authorization.
- Open a details view for source paths, stages/timestamps, errors, record links,
  and eligible retry actions. Keep large manifests and failure lists out of the
  initial history response; fetch paginated details on demand.
- Poll active jobs while visible; avoid polling settled history continuously.
  Preserve the existing rows during refresh and use fixed loading/empty regions.
- Retry remains owner/permission checked, respects session expiration, and must
  not start another worker while the previous attempt may still be running.
  Show the reason when retry is unavailable, including expired staged inputs.

Initially, directory uploads and GCS batches have durable job metadata. Explicitly
label that coverage. A complete history including single-file/ZIP uploads needs
submission tracking for those paths; do not imply those uploads are already
represented or fabricate historical submissions from record creation timestamps.

## Retention and recovery

Treat visibility and storage retention as separate decisions. Hiding successful
jobs from the upload form does not delete their metadata or their records.

Before adding cleanup, choose a retention period for completed job details and
whether to retain a compact summary longer. Keep active jobs, retryable sessions,
and record audit history outside automatic deletion. Existing seven-day upload
sessions and fourteen-day temporary GCS cleanup are unchanged by this proposal.

Add explicit worker-started/last-progress timestamps and stage/error details
before offering stuck-job recovery in the history view. A VPN interruption,
Document AI wait, missing worker, and stale process status need distinct evidence.
Do not resubmit Document AI operations simply because the UI has not changed.

## Implementation sequence and estimate

1. Dialog shell, stable file/status regions, and current-upload summary:
   approximately 1–2 developer days including responsive and accessibility checks.
2. Paginated history API and view, record links, filters, and details/retry states:
   approximately 2–3 developer days including authorization and recovery tests.
3. Optional single-file/ZIP tracking and metadata retention: scope separately
   after deciding coverage and retention. These are not prerequisites for the
   dialog layout improvement.

Validate 1/10/500 selected files, slow/failed initial requests, empty history,
multiple active jobs, long filenames, browser refresh, expired retries, keyboard
navigation, and small screens. Use browser checks for stable dialog dimensions
and footer placement; API tests must cover pagination, group isolation, and
older active jobs. Keep the existing transfer/retry tests and build the docs.
