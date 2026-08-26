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

When `STORAGE_BACKEND=google`, set `STORAGE_BUCKET_NAME` and `STORAGE_SERVICE_KEY` in `deployment/.env`. `STORAGE_SERVICE_KEY` may be an absolute path or a filename next to `deployment/.env`; the `docker:start` scripts mount that file into the backend container automatically. If you run `docker compose` directly, add an equivalent read-only bind mount for the key file and set `STORAGE_SERVICE_KEY` or `GOOGLE_APPLICATION_CREDENTIALS` to the container path.

## Database Settings

The backend receives database settings from `deployment/.env`, with Docker-local defaults:

```dotenv
DB_CONNECTION=mongodb://mongodb:27017
DB_NAME=isgs
DB_USERNAME=
DB_PASSWORD=
```

Set these values in `deployment/.env` to point the backend at a different MongoDB instance. Existing `.env` files are not regenerated from `.env.example`, so add any missing keys manually after pulling deployment changes.

## MongoDB Seed Data

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
