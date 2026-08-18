---
name: ogrre-frontend-development
description: Build, edit, review, or refactor the OGRRE React frontend. Use for any implementation touching orphaned-wells-ui frontend code, including React components, views, TypeScript types, MUI styling, theme files, shared UI components, routing, auth UI, table/filter workflows, upload/download/review/clean interactions, API usage, tests, Cypress e2e flows, documentation, deployment configuration, generated artifact cleanup, or frontend dependency changes.
---

# OGRRE Frontend Development

Use this skill for frontend implementation in `orphaned-wells-ui`. Keep changes
practical, accessible, scoped, and consistent with the current React,
TypeScript, Material UI, and Create React App package.

## Required Context

Before editing, inspect the relevant local patterns:

- `README.md`, `package.json`, `package-lock.json`, and deployment docs before
  changing setup, dependencies, scripts, validation, build behavior, or local
  development workflow.
- `src/App.tsx` before changing routes, authenticated shell behavior, protected
  routes, login routing, header/banner/progress-bar placement, or global
  providers.
- `src/usercontext.tsx` before changing authentication state, user metadata,
  permissions, anonymous behavior, or app-wide theme provider behavior.
- `src/themes/primaryTheme.tsx`, `src/styles.ts`, nearby `.css` files, and
  nearby component `sx` usage before changing durable styling, theme colors,
  spacing, typography, or MUI overrides.
- Nearby `src/views/**`, `src/components/**`, hooks, utilities, tests, and
  Cypress specs for the workflow being changed.
- `src/services/app.service.ts`, `src/types.ts`, and `src/util.ts` before
  changing API usage, payload/response shapes, table filters, shared data
  transforms, or call helpers.
- `../orphaned-wells-ui-server` routes and data-manager methods when backend
  contracts are unclear or a frontend change depends on new backend behavior.
- `docs/docs/**`, `docs/README.md`, and deployment docs when setup, behavior,
  user workflows, auth, data contracts, deployment, or validation expectations
  change.
- For API wiring work, also read
  `.codex/skills/ogrre-frontend-api-connection/SKILL.md`.
- For JSON/CSV record import work, also read
  `.codex/skills/ogrre-json-record-import/SKILL.md`.

Prefer existing OGRRE components, MUI patterns, service helpers, and data
shapes over new abstractions. Keep new logic close to the owning view,
component, service function, hook, or utility unless shared behavior is already
clear.

## Frontend Shape

Respect the current boundaries:

- `src/views/**` owns page-level workflows, routing state, data loading, and
  composition of feature components.
- `src/components/**` owns reusable UI sections such as `Subheader`,
  `PopupModal`, `ErrorBar`, tables, dialogs, upload flows, document display,
  schema editing, header controls, and progress feedback.
- `src/services/app.service.ts` owns backend fetch wrappers using
  `BACKEND_URL`, `CORS_MODE`, and `JSON_HEADERS`.
- `src/types.ts` owns shared prop, payload, response, table, record, processor,
  user, and schema shapes.
- `src/util.ts` owns shared helpers such as `callAPI`, filter conversion,
  formatting, table defaults, auth refresh behavior, and record utility logic.
- `src/usercontext.tsx` owns authenticated user state, permission checks, and
  top-level MUI theme provision.
- `src/themes/primaryTheme.tsx`, `src/styles.ts`, component-local `sx`, and
  component CSS files own durable styling.
- `src/tests/**` owns React Testing Library unit/component tests, while
  `cypress/e2e/**` owns browser workflow coverage.

Keep React components declarative. Move complex calculations, API
orchestration, filter transformations, and record/attribute manipulation into
utilities, hooks, or clearly named helper functions near the owning feature.

## Component Boundaries

Keep component ownership explicit:

- Keep pages mostly as composers of focused components. Extract reusable or
  independently understandable UI sections before a view becomes hard to scan.
- Place feature-specific components near their owning feature or existing
  component folder. Move generic shared primitives only when more than one
  workflow clearly needs them.
- Keep props explicit and focused. Avoid passing large state objects when only
  a few values or callbacks are needed.
- Prefer custom hooks for reusable stateful behavior and utility functions for
  nontrivial data transformations.
- Preserve existing `data-cy` selectors for Cypress-covered workflows and add
  stable selectors when new e2e coverage needs them.

Before hand-assembling durable UI for page actions, confirmations, dialogs,
tables, filters, uploads, errors, or loading indicators, check whether existing
components such as `Subheader`, `PopupModal`, MUI `Dialog`, `ErrorBar`,
`TableLoading`, `EmptyTable`, `SplitButton`, or nearby table/dialog patterns
already fit.

## Product Posture

Treat OGRRE as an operational review tool for repeated data workflows:

- Prioritize clarity, density, scanability, and predictable navigation over
  marketing-style layouts, oversized type, decorative surfaces, or novelty
  effects.
- Use existing OGRRE terminology in user-facing text: project, record group,
  record, processor, review, clean.
- Build complete states for loading, empty, error, success, disabled, locked,
  permission-denied, and partial-availability cases when the workflow can enter
  them.
- Keep copy direct and operational. Avoid lorem ipsum, fake metrics, fake
  project names, fake users, or exaggerated success language in production UI.
- Do not render controls for unavailable actions as if they will work. Use
  disabled states, permission gates, honest empty states, or explicit error
  handling when backend support or permissions are absent.

## MUI, Styling, And Layout

Keep styling consistent with the current Material UI system:

- Use MUI components, MUI icons from `@mui/icons-material`, `sx` styling, and
  existing style objects before adding new styling approaches.
- Use `Subheader` actions for page-level menus. Use `PopupModal` for simple
  confirmations and MUI `Dialog` for richer prompts or flows with more than
  two actions.
- Keep destructive actions visibly destructive with MUI error coloring and
  confirmation flows that match nearby behavior.
- Prefer theme-aware MUI palette values when practical. If using hard-coded
  colors, match nearby status and table conventions and keep contrast readable.
- Use stable dimensions and responsive constraints for tables, toolbars,
  dialogs, document panes, image controls, and fixed-position elements so text,
  buttons, and icons do not overlap or shift unexpectedly.
- Support mobile, tablet, and desktop without horizontal overflow, clipped
  controls, or inaccessible actions.
- Avoid introducing Tailwind, lucide-react, custom design systems, or unrelated
  CSS frameworks.

## Accessibility And Interaction

Accessibility is required behavior:

- Use semantic HTML and MUI controls before ARIA. Buttons perform actions;
  anchors navigate; labels connect to inputs; headings describe structure.
- Ensure interactive elements are keyboard reachable, named, and visibly
  focusable. Add `aria-label` for icon-only controls.
- Preserve focus and escape/close behavior across dialogs, modals, menus,
  popovers, destructive confirmations, and upload flows.
- Keep loading, error, locked, and disabled states visible to users and
  understandable to assistive technology when practical.
- Use motion only when it supports workflow feedback. Avoid nonessential
  infinite animation except loading indicators and respect reduced-motion
  expectations when adding custom animation.

## API, Auth, And Data Workflows

Keep frontend data behavior aligned with the backend:

- Add backend calls in `src/services/app.service.ts` using existing
  `BACKEND_URL`, `CORS_MODE`, and `JSON_HEADERS` conventions. Do not set JSON
  headers for `FormData`.
- Use `callAPI` from `src/util.ts` in components unless nearby code clearly
  uses direct `fetch`.
- Put shared prop and data shapes in `src/types.ts` when payloads, responses,
  table data, records, processors, users, or component contracts change.
- Gate UI actions with `useUserContext().hasPermission(...)`; backend
  permissions must still be enforced server-side.
- Preserve protected route, login redirect, auth refresh, cookie-backed
  requests, and anonymous permission behavior.
- Keep table filters as `FilterOption[]` in UI state and convert with
  `convertFiltersToMongoFormat` immediately before API calls.
- Preserve record table localStorage behavior for filters, sorting, pagination,
  and route-state breadcrumbs unless a migration path is explicit.
- Route user-facing request failures through existing error surfaces such as
  `ErrorBar`, dialog error text, or nearby error handlers. Do not silently
  swallow failed backend calls.

## Hard Guardrails Against Fake Production

Do not create frontend behavior that pretends unsupported features work:

- Do not add mock-only data, fake auth/role checks, simulated uploads, invented
  backend capabilities, hard-coded successful responses, or placeholder
  persistence to production code.
- Keep mocks inside tests, Cypress fixtures, stories if they are added, or
  clearly marked local development harnesses.
- Inspect real backend routes or docs before wiring unclear contracts. If
  backend support is missing, make the UI unavailable honestly or coordinate
  the backend change.
- Make failed requests, missing configuration, permission denials, locked
  records, processor unavailability, and partial upload/download failures
  visible in the workflow.

## Documentation And Cleanup

Frontend changes must leave nearby code and docs coherent:

- Update `README.md`, `deployment/README.md`, `docs/docs/**`, or repo docs when
  setup, scripts, validation, architecture, contracts, user-facing behavior,
  Docker/e2e flow, deployment, or operational expectations change.
- Remove unused imports, dead branches, stale helpers, redundant styles,
  obsolete tests, duplicate markup, and generated artifacts introduced or
  exposed by the change.
- Do not edit or commit `node_modules/`, `docs/node_modules/`, `build/`,
  `docs/.docusaurus/`, coverage output, `.DS_Store`, local environment files,
  or downloaded/generated data unless explicitly required and safe.
- Keep cleanup scoped to the files and ownership area being changed. Do not
  broaden into unrelated refactors or overwrite user changes.

## Tests And Validation

Choose the narrowest validation that proves the change:

- Run `npm test -- --watchAll=false --runInBand` after behavioral,
  component-state, helper, hook, permission, accessibility, or unit-test
  changes.
- Run `npm run build` after TypeScript, route, service, shared type, package,
  or app-shell changes.
- Run focused Cypress commands such as `npm run e2e:smoke`, `npm run e2e:run`,
  or the relevant e2e workflow when browser behavior, uploads/downloads,
  routing, auth gates, or record review flows are the main risk.
- Run `npm run docs:start` or Docusaurus validation when docs-site behavior or
  docs configuration changes.
- For docs- or skill-only changes, run the skill validator when applicable and
  `git diff --check`.
