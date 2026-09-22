# Development Docker Stack

This stack runs the frontend, backend, and MongoDB for local development.

## Start Everything

From the frontend repository:

```sh
npm run docker:start
```

The Node script creates `deployment/.env` from `.env.example` if needed.
These Node-backed commands are the cross-platform path for macOS, Linux, and Windows.
Shell environment variables override matching values from `deployment/.env` for these Node-backed commands.

By default, `BACKEND_MODE=auto` uses local backend source at `../orphaned-wells-ui-server` when that source directory exists. If the backend source is not present, it pulls `BACKEND_IMAGE` instead. Source mode bind-mounts the backend into the container and runs Uvicorn with `--reload`, scoped to `/code/ogrre` with a short reload delay and Python bytecode writes disabled so Docker Desktop file-sync timing is less likely to serve stale imports. Normal Python code edits are picked up by the running backend. Dependency, packaging, Dockerfile, and startup-command changes still require `npm run docker:start` so Compose can rebuild and recreate the backend container.

For frontend-only CI, set `BACKEND_MODE=image` and make sure the workflow can pull `BACKEND_IMAGE`.

For local backend development, keep the backend repo checked out as a sibling or set `BACKEND_AUTO_CLONE=true`.

If `BACKEND_IMAGE` is private, authenticate with the registry before running `npm run docker:start`. For Docker Hub in GitHub Actions, that usually means adding repository secrets and running `docker/login-action` before the npm command.

## Stop Everything

To stop the running containers without removing containers, networks, or named volumes:

```sh
npm run docker:stop
```

To stop and remove containers and the network, while keeping named volumes:

```sh
npm run docker:down
```

To remove containers, the network, and named volumes:

```sh
npm run docker:clean
```

## Shell Script Variants

The legacy shell scripts are still available for macOS, Linux, Git Bash, and WSL:

```sh
npm run docker:start:shell
npm run docker:stop:shell
npm run docker:down:shell
npm run docker:clean:shell
```

You can also run Compose directly:

```sh
cp deployment/.env.example deployment/.env
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml up -d --build
```

That direct command uses the base Compose file only. Include `docker-compose.source.yml` when you want local backend source mounted into the backend container.

To force local backend source mode directly:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml -f deployment/docker-compose.source.yml up -d --build
```

The app runs at `http://localhost:3000`, and the backend health endpoint is `http://localhost:8001/health`.

Published ports are bound to `127.0.0.1` by default through `DEV_HOST_BIND`, so the dev stack is reachable from the local machine without exposing MongoDB, the backend, or the frontend on all host interfaces. Inside Docker, services bind to their Compose hostnames so the containers can still communicate with each other.

When `STORAGE_BACKEND=local`, uploaded files are stored in the backend `backend_data` volume under `/data/uploads` and served by the backend at `LOCAL_STORAGE_URL_BASE`. If you change `BACKEND_HOST_PORT`, update `LOCAL_STORAGE_URL_BASE` in `deployment/.env` to match.

When `STORAGE_BACKEND=google`, set `STORAGE_BUCKET_NAME` and `STORAGE_SERVICE_KEY` in `deployment/.env`. `STORAGE_SERVICE_KEY` may be an absolute path or a filename next to `deployment/.env`; the `docker:start` scripts mount that file into the backend container automatically.

When `DOCUMENT_AI_BACKEND=google` and you want Docker to use a service-account key for Document AI, set `DOCUMENT_AI_SERVICE_KEY` in `deployment/.env`. It may be an absolute path or a filename next to `deployment/.env`; the `docker:start` scripts mount it separately from the storage key. If you run `docker compose` directly, add equivalent read-only bind mounts for both key files and set `STORAGE_SERVICE_KEY` and `DOCUMENT_AI_SERVICE_KEY` to the container paths.

Service-account JSON files are secrets. Name local key files with a `-service-key.json` suffix, such as `ogrre-storage-service-key.json`, so the repository `.gitignore` rules catch them before commit.

## Database Settings

The backend receives database settings from `deployment/.env`, with Docker-local defaults:

```dotenv
DB_CONNECTION=mongodb://mongodb:27017
DB_NAME=isgs
DB_USERNAME=
DB_PASSWORD=
```

Set these values in `deployment/.env` to point the backend at a different MongoDB instance. Existing `.env` files are not regenerated from `.env.example`, so add any missing keys manually after pulling deployment changes.

`SCHEMA_INFERENCE_MAX_RECORDS` sets the maximum record sample for explicit schema
generation and extension (default 1,000; range 1–10,000). Add it to an existing
`deployment/.env` and recreate the backend container to change it. Fixed byte,
field-count, nesting, and query-time limits also apply. The backend creates the
sampling index on startup; no record rewrite or schema generation runs at startup.

### Lightweight record loading and schema maintenance

Deploy the frontend and backend changes together. With a sibling backend checkout,
use `BACKEND_MODE=source npm run docker:start` to build and run the current backend
with the current frontend. In image mode, publish/select a backend image containing
the same changes, pull that image, and recreate the backend; a previously cached
image does not contain local backend fixes. No new environment variables or seed
database reset are required for lightweight loading.

Project/table requests and statistics do not reconcile entire record groups.
Statistics tolerate malformed attribute arrays and entries. Opening a record
prepares only that record. Missing schemas do not prevent browsing; failed API
requests display an error with Retry in the frontend.

Schema retirement/replacement runs as an explicit mutation, and saved package
imports can resume their reconciliation steps. For a repo-package update or old
retirement definitions that have not been applied, use the optional bounded
maintenance command in the updated backend container:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml exec -T backend python -m ogrre.reconcile_schema_records RECORD_GROUP_ID
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml exec backend python -m ogrre.reconcile_schema_records RECORD_GROUP_ID --batch-size 100 --apply
```

The commands use the running backend's database configuration, including cloud
overrides. Verify the displayed database, collaborator, and group before confirming
an apply. Repeat batches until `complete` is true and `remaining` is zero. Lists
use stored retirement flags until maintenance completes. Do not add this command
to container startup or page-loading hooks. Neither this command nor
`migrate_schema_bindings` is required just to browse existing data.

## MongoDB Seed Data

### Schema roles and permissions

The bundled dump and `docs/static/downloads/InitializeMongoDB.py` grant
`manage_schema` to team leads and all system roles, and
`manage_schema_destructive` only to `sys_admin`. Fresh Docker databases and
restores of the updated dump need no schema-permission migration.

Existing volumes retain their stored roles when containers restart. To update
those roles while preserving the database's data, run the migration using an
updated backend:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml exec -T backend python -m ogrre.migrate_schema_permissions
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml exec backend python -m ogrre.migrate_schema_permissions --apply
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml exec -T backend python -m ogrre.migrate_schema_permissions
```

Run these from the frontend repository. The commands use the running backend's
database configuration, including any cloud database override. Each command
shows the hosts, database name, configured collaborator, and proposed changes
without URI credentials or query options. The apply command needs interactive
input: verify the target and preview, then enter `y` to confirm. Any other answer
or end of input cancels. The final command should report `No changes needed.`
with an empty changes list. For the E2E stack, use `deployment/.env.e2e` in place
of `deployment/.env`.

The migration grants safe schema management to team leads and all system roles,
and destructive schema management only to `sys_admin`. It preserves other
permissions and user role assignments. Refresh the app after migrating.

The development and E2E defaults use `REQUIRE_AUTH=false`. Destructive schema
actions intentionally remain disabled in that mode, even after migrating roles.
To test them, enable authentication and sign in with the `sys_admin` system role.

### Restore the sample dump

The sample dump lives at `deployment/mongo-dumps/sample_mongodump`. MongoDB restores it automatically the first time the `mongodb_data` volume is created.

To reset and reinitialize from the dump:

```sh
npm run docker:clean
npm run docker:start
```

To restore the dump into an existing MongoDB volume:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml --profile seed run --rm mongo-restore
```
