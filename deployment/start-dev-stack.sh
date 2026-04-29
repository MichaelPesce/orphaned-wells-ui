#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
env_file="${script_dir}/.env"

if [ ! -f "${env_file}" ]; then
  cp "${script_dir}/.env.example" "${env_file}"
  echo "Created ${env_file} from .env.example"
fi

set -a
. "${env_file}"
set +a

backend_dir="${BACKEND_DIR:-../../orphaned-wells-ui-server}"
backend_url="${BACKEND_GIT_URL:-https://github.com/CATALOG-Historic-Records/orphaned-wells-ui-server.git}"
backend_mode="${BACKEND_MODE:-auto}"
backend_auto_clone="${BACKEND_AUTO_CLONE:-false}"

case "${backend_dir}" in
  /*) backend_path="${backend_dir}" ;;
  *) backend_path="${script_dir}/${backend_dir}" ;;
esac

if [ "${backend_auto_clone}" = "true" ] && [ ! -d "${backend_path}/.git" ]; then
  mkdir -p "$(dirname "${backend_path}")"
  git clone "${backend_url}" "${backend_path}"
fi

compose_files="-f ${script_dir}/docker-compose.dev.yml"

case "${backend_mode}" in
  source)
    if [ ! -d "${backend_path}/.git" ]; then
      echo "BACKEND_MODE=source requires a backend checkout at ${backend_path}" >&2
      exit 1
    fi
    compose_files="${compose_files} -f ${script_dir}/docker-compose.source.yml"
    ;;
  image)
    ;;
  auto)
    if [ -d "${backend_path}/.git" ]; then
      compose_files="${compose_files} -f ${script_dir}/docker-compose.source.yml"
    fi
    ;;
  *)
    echo "Invalid BACKEND_MODE='${backend_mode}'. Use auto, image, or source." >&2
    exit 1
    ;;
esac

# shellcheck disable=SC2086
docker compose --env-file "${env_file}" ${compose_files} up -d --build "$@"
