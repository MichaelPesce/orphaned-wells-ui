#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deployment_dir=$(CDPATH= cd -- "${script_dir}/.." && pwd)
repo_root=$(CDPATH= cd -- "${deployment_dir}/.." && pwd)
env_file="${deployment_dir}/.env"

if [ ! -f "${env_file}" ]; then
  env_file="${deployment_dir}/.env.example"
fi

set -a
. "${env_file}"
set +a

backend_dir="${BACKEND_DIR:-../../orphaned-wells-ui-server}"
backend_mode="${BACKEND_MODE:-auto}"

has_backend_source() {
  [ -f "$1/deployment/dockerfile" ] && [ -f "$1/ogrre/main.py" ]
}

case "${backend_dir}" in
  /*) backend_path="${backend_dir}" ;;
  *) backend_path="${deployment_dir}/${backend_dir}" ;;
esac

compose_files="-f ${deployment_dir}/docker-compose.dev.yml"

if { [ "${backend_mode}" = "source" ] || [ "${backend_mode}" = "auto" ]; } && has_backend_source "${backend_path}"; then
  compose_files="${compose_files} -f ${deployment_dir}/docker-compose.source.yml"
fi

cd "${repo_root}"
# shellcheck disable=SC2086
docker compose --env-file "${env_file}" ${compose_files} stop "$@"
