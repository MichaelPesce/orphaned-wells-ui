#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "${script_dir}/.." && pwd)
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

case "${backend_dir}" in
  /*) backend_path="${backend_dir}" ;;
  *) backend_path="${script_dir}/${backend_dir}" ;;
esac

if [ ! -d "${backend_path}/.git" ]; then
  mkdir -p "$(dirname "${backend_path}")"
  git clone "${backend_url}" "${backend_path}"
fi

docker compose --env-file "${env_file}" -f "${script_dir}/docker-compose.dev.yml" up -d --build "$@"
