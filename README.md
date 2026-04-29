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
