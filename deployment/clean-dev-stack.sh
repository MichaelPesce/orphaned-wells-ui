#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
env_file="${script_dir}/.env"

if [ ! -f "${env_file}" ]; then
  env_file="${script_dir}/.env.example"
fi

set -a
. "${env_file}"
set +a

backend_dir="${BACKEND_DIR:-../../orphaned-wells-ui-server}"
backend_mode="${BACKEND_MODE:-auto}"

case "${backend_dir}" in
  /*) backend_path="${backend_dir}" ;;
  *) backend_path="${script_dir}/${backend_dir}" ;;
esac

compose_files="-f ${script_dir}/docker-compose.dev.yml"

if { [ "${backend_mode}" = "source" ] || [ "${backend_mode}" = "auto" ]; } && [ -d "${backend_path}/.git" ]; then
  compose_files="${compose_files} -f ${script_dir}/docker-compose.source.yml"
fi

# shellcheck disable=SC2086
docker compose --env-file "${env_file}" ${compose_files} down -v --remove-orphans "$@"
