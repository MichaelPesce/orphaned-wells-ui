# orphaned-wells-ui
WP7 UI

## Documentation

See our draft [documentation site](https://catalog-historic-records.github.io/orphaned-wells-ui/).
This site is built from the contents of the `docs/` directory and hosted by Github pages.

## Getting Started

### Install JavaScript Dependencies

Prerequisite: Node.js with npm.

```console
cd <orphaned-wells-ui-path>
npm clean-install
```

## Run Locally With Docker

This is the recommended local development path. It starts the frontend,
backend, and MongoDB together.

### Prerequisites

- Node.js with npm
- Docker Desktop or Docker Engine
- Docker Compose v2, available as `docker compose`
- Docker running before you start the stack

### Start the Full Development Stack

```console
cd <orphaned-wells-ui-path>
npm run docker:start
```

The app runs at `http://localhost:3000`.
The backend runs at `http://localhost:8001`.
The Docker-published dev ports bind to localhost by default.

For stop, clean, backend mode, seed data, and advanced Docker configuration,
see [deployment/README.md](deployment/README.md).

## Run the Frontend Only

Use this option when you want to run only the React frontend outside Docker.
You will need a backend running separately and must point the frontend at it
with `REACT_APP_BACKEND_URL`.

Backend repository:
https://github.com/CATALOG-Historic-Records/orphaned-wells-ui-server

```console
cd <orphaned-wells-ui-path>
npm start
```

## CI branch pairing

Push and pull-request runs of **App Tests** test the triggering frontend commit
against `main` in `CATALOG-Historic-Records/orphaned-wells-ui-server`. E2E tests
build that backend from source instead of using the published Docker image.

For coordinated changes, select **Actions → App Tests → Run workflow**. Choose
the frontend branch in the branch selector, set `backend_ref` to the backend
branch, tag, or commit, and optionally change `backend_repository` to a fork
(`owner/repository`). Both inputs have defaults; leaving them unchanged tests
against the upstream backend's `main`. These overrides apply only to that run;
later push/PR runs still use `main`.

From this repository, the equivalent CLI invocation for matching branches is:

```sh
gh workflow run tests.yml --ref db-schemas -f backend_ref=db-schemas
```

Add `-f backend_repository=OWNER/orphaned-wells-ui-server` to select a fork.
Public repositories use the normal Actions token. A private counterpart requires
the optional `CHECKOUT_TOKEN` secret with read access to both repositories.

GitHub requires the workflow's `workflow_dispatch` trigger to exist on the
repository's default branch before manual runs are available. Land these CI
changes there once; subsequent branch pairings require no workflow edits.
The backend's **Checks** workflow provides the corresponding `frontend_ref`
and `frontend_repository` inputs.
