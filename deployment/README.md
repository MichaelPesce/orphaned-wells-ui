# Development Docker Stack

This stack runs the frontend, backend, and MongoDB for local development.

## Start Everything

From the frontend repository:

```sh
npm run docker:dev:start
```

The Node script creates `deployment/.env` from `.env.example` if needed.
These Node-backed commands are the cross-platform path for macOS, Linux, and Windows.

By default, `BACKEND_MODE=auto` uses a sibling backend checkout at `../orphaned-wells-ui-server` when it exists. If the backend repo is not present, it pulls `BACKEND_IMAGE` instead. In both cases, Compose overrides the backend environment so it connects to local Docker MongoDB at `mongodb://mongodb:27017`.

For frontend-only CI, set `BACKEND_MODE=image` and make sure the workflow can pull `BACKEND_IMAGE`.

For local backend development, keep the backend repo checked out as a sibling or set `BACKEND_AUTO_CLONE=true`.

If `BACKEND_IMAGE` is private, authenticate with the registry before running `npm run docker:dev:start`. For Docker Hub in GitHub Actions, that usually means adding repository secrets and running `docker/login-action` before the npm command.

The shorter `npm run docker:dev` command is kept as an alias for `npm run docker:dev:start`.

## Stop Everything

To stop the running containers without removing containers, networks, or named volumes:

```sh
npm run docker:dev:stop
```

To stop and remove containers and the network, while keeping named volumes:

```sh
npm run docker:dev:down
```

To remove containers, the network, and named volumes:

```sh
npm run docker:dev:clean
```

The shorter `npm run docker:stop`, `npm run docker:down`, and `npm run docker:clean` commands are kept as aliases.

## Shell Script Variants

The legacy shell scripts are still available for macOS, Linux, Git Bash, and WSL:

```sh
npm run docker:dev:start:shell
npm run docker:dev:stop:shell
npm run docker:dev:down:shell
npm run docker:dev:clean:shell
```

You can also run Compose directly:

```sh
cp deployment/.env.example deployment/.env
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml up -d --build
```

To force local backend source mode directly:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml -f deployment/docker-compose.source.yml up -d --build
```

The app runs at `http://localhost:3000`, and the backend health endpoint is `http://localhost:8001/health`.

When `STORAGE_BACKEND=local`, uploaded files are stored in the backend `backend_data` volume under `/data/uploads` and served by the backend at `LOCAL_STORAGE_URL_BASE`. If you change `BACKEND_HOST_PORT`, update `LOCAL_STORAGE_URL_BASE` in `deployment/.env` to match.

## MongoDB Seed Data

The sample dump lives at `deployment/mongo-dumps/sample_mongodump`. MongoDB restores it automatically the first time the `mongodb_data` volume is created.

To reset and reinitialize from the dump:

```sh
npm run docker:dev:clean
npm run docker:dev:start
```

To restore the dump into an existing MongoDB volume:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml --profile seed run --rm mongo-restore
```
