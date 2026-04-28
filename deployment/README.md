# Development Docker Stack

This stack runs the frontend, backend, and MongoDB for local development.

## Start Everything

From the frontend repository:

```sh
npm run docker:dev
```

The script creates `deployment/.env` from `.env.example` if needed and clones the backend repository into `../orphaned-wells-ui-server` if it is missing.

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
