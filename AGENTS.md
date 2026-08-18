# OGRRE Frontend Agent Guide

This repo is the React, TypeScript, and MUI frontend for OGRRE. The paired backend repo is `../orphaned-wells-ui-server`.

## Practices

- Before making frontend code updates, use `$ogrre-frontend-development` from `.codex/skills/ogrre-frontend-development`.
- Read the surrounding component, service, type, and utility code before editing.
- Keep changes scoped to the requested workflow and avoid unrelated refactors.
- Preserve existing worktree changes; do not reset or revert unrelated files.
- Prefer `rg` for search.
- Use existing OGRRE terminology in user-facing text: project, record group, record, processor, review, clean.
- Remove unused, obsolete, or orphaned code when changes make it unnecessary.
- Do not leave commented-out code or dead code paths.
- Keep generated files, dependency directories, and local artifacts out of source control unless they are intentionally part of the project.

## Code Organization

- Keep files focused on a single primary responsibility.
- Prefer small, cohesive, well-named component files over large monolithic files. Optimize for maintainability over minimizing file count.
- Extract reusable or independently understandable UI sections into nearby feature components before page/component files become difficult to navigate.
- Pages should primarily compose feature components rather than implement complex UI directly.
- Separate presentation, state management, API interactions, and data transformations into appropriate components, hooks, service modules, and utilities.
- Prefer composition over deeply nested conditional rendering.
- Keep component props focused and explicit. Avoid passing large state objects when only a few values are needed.
- Extract repeated TSX into reusable components instead of duplicating markup.
- Place components close to the feature that owns them unless they are intentionally shared across features.
- Shared UI primitives belong under `src/components/ui`; feature-specific components should remain within their feature directory.
- Prefer custom hooks for reusable stateful behavior instead of duplicating effects or state logic.
- Keep React components primarily declarative. Move complex calculations, data transformations, and business rules into utility functions or hooks.
- Avoid defining multiple large components in a single file. Small helper components are acceptable only when tightly coupled to the parent and unlikely to be reused.
- Organize frontend code by feature rather than by component type whenever practical.
- Keep abstractions proportional to current needs and clear future extension points.
- Use concise comments for important files, complex functions, non-obvious logic, and critical integration points where context improves maintainability.

## API Wiring

- Add backend calls in `src/services/app.service.ts` using `BACKEND_URL`, `CORS_MODE`, and `JSON_HEADERS`.
- Use `callAPI` from `src/util.ts` in components unless nearby code clearly uses direct `fetch`.
- Put shared prop and data shapes in `src/types.ts`.
- Gate UI actions with `useUserContext().hasPermission(...)`; backend permissions must still be enforced server-side.
- Keep table filters as `FilterOption[]` in UI state and convert with `convertFiltersToMongoFormat` immediately before API calls.

## UI Patterns

- Use `Subheader` actions for page-level menus.
- Use `PopupModal` for simple confirmations and MUI `Dialog` for prompts with richer content or more than two actions.
- Use MUI components and existing table/dialog styling patterns before introducing new layout primitives.

## Verification

- Run `npm test -- --watchAll=false --runInBand` after behavioral/component changes.
- Run `npm run build` after TypeScript, service, route wiring, or shared type changes.

## Repo-Local Skills

- Use `$ogrre-frontend-development` from `.codex/skills/ogrre-frontend-development` before frontend code updates, including views, components, styling, theme, routing, auth UI, tables, filters, tests, docs, deployment, dependencies, or cleanup.
- Use `$ogrre-frontend-api-connection` from `.codex/skills/ogrre-frontend-api-connection` for frontend API wiring work.
