# Development Docker Stack

This stack runs the frontend, backend, and MongoDB for local development.

## Start Everything

From the frontend repository:

```sh
npm run docker:dev
```

The script creates `deployment/.env` from `.env.example` if needed.

By default, `BACKEND_MODE=auto` uses a sibling backend checkout at `../orphaned-wells-ui-server` when it exists. If the backend repo is not present, it pulls `BACKEND_IMAGE` instead. In both cases, Compose overrides the backend environment so it connects to local Docker MongoDB at `mongodb://mongodb:27017`.

For frontend-only CI, set `BACKEND_MODE=image` and make sure the workflow can pull `BACKEND_IMAGE`.

For local backend development, keep the backend repo checked out as a sibling or set `BACKEND_AUTO_CLONE=true`.

If `BACKEND_IMAGE` is private, authenticate with the registry before running `npm run docker:dev`. For Docker Hub in GitHub Actions, that usually means adding repository secrets and running `docker/login-action` before the npm command.

## Stop Everything

```sh
npm run docker:down
```

This stops and removes the containers and network, but keeps named volumes such as MongoDB data and `node_modules`.

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

## MongoDB Seed Data

The sample dump lives at `deployment/mongo-dumps/sample_mongodump`. MongoDB restores it automatically the first time the `mongodb_data` volume is created.

To reset and reinitialize from the dump:

```sh
npm run docker:down -- -v
npm run docker:dev
```

To restore the dump into an existing MongoDB volume:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml --profile seed run --rm mongo-restore
```
