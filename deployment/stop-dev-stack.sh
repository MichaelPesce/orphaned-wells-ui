#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
env_file="${script_dir}/.env"

if [ ! -f "${env_file}" ]; then
  env_file="${script_dir}/.env.example"
fi

docker compose --env-file "${env_file}" -f "${script_dir}/docker-compose.dev.yml" down "$@"
