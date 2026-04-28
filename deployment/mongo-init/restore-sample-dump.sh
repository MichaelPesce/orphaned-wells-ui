#!/usr/bin/env bash
set -euo pipefail

if [[ "${MONGO_INIT_SAMPLE_DUMP:-true}" != "true" ]]; then
  echo "Skipping sample MongoDB dump restore."
  exit 0
fi

db_name="${MONGO_INITDB_DATABASE:-isgs}"
dump_dir="${MONGO_DUMP_DIR:-/docker-entrypoint-initdb.d/sample_mongodump}"
source_db="${MONGO_DUMP_SOURCE_DB:-${db_name}}"

if [[ -d "${dump_dir}/${source_db}" ]]; then
  echo "Restoring MongoDB sample dump database '${source_db}' into '${db_name}' from ${dump_dir}/${source_db}"
  mongorestore --db "${db_name}" "${dump_dir}/${source_db}"
else
  echo "Restoring full MongoDB sample dump from ${dump_dir}"
  mongorestore "${dump_dir}"
fi
