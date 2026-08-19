---
name: ogrre-frontend-api-connection
description: Add or update OGRRE React frontend API wiring. Use when implementing a new backend route call from the UI, adding service functions in src/services/app.service.ts, connecting views/components to callAPI, handling table filters, permissions, dialogs, or updating frontend types for backend data flows.
---

# OGRRE Frontend API Connection

## Workflow

1. Inspect the calling view/component, `src/services/app.service.ts`, `src/types.ts`, and shared helpers in `src/util.ts` before editing.
2. Add service functions in `app.service.ts` using `BACKEND_URL`, `CORS_MODE`, and `JSON_HEADERS` for JSON requests. Do not add JSON headers for `FormData`.
3. Use `callAPI` from `src/util.ts` from views/components unless the surrounding code uses direct `fetch`.
4. Add or extend TypeScript interfaces in `src/types.ts` when props or payload shape changes.
5. Gate UI actions with `useUserContext().hasPermission(...)` in the same component layer as nearby actions.
6. Preserve existing route naming and payload conventions from the backend: snake_case endpoint paths, JSON bodies for structured payloads, and explicit path IDs where existing routes do so.
7. Verify with `npm test -- --watchAll=false --runInBand` and `npm run build` when frontend behavior or types change.

## Component Patterns

- Use `Subheader` `actions` for page-level options such as rename, clean, delete, or export controls.
- Use `PopupModal` for simple one-action or two-action confirmations.
- Use MUI `Dialog`, `DialogTitle`, `DialogContent`, and `DialogActions` for flows with more than two choices or richer content.
- Keep destructive actions visibly destructive with `color="error"` and use `variant="contained"` only for the primary destructive choice.
- Keep state local unless a parent needs table state. For `RecordsTable`, expose optional callbacks instead of reaching into child state.

## Filters

- Keep table filter UI state as `FilterOption[]`.
- Convert filters at the API boundary with `convertFiltersToMongoFormat(filters)`.
- For record table state, respect existing `localStorage` keys such as `appliedFilters` and `sorted` when extending behavior.
- Send filters as a `filter` object in request bodies to match `getRecords`, download, and size-estimate APIs.

## Error Handling

- Route API failures through the component's existing error handler and `ErrorBar` when present.
- Avoid swallowing errors with `console.error` for user-facing workflows unless the surrounding component already has no visible error surface.
- Reset or close modals before API calls only when the current screen already follows that pattern.
