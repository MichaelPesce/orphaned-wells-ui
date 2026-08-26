#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
deployment_dir=$(CDPATH= cd -- "${script_dir}/.." && pwd)
repo_root=$(CDPATH= cd -- "${deployment_dir}/.." && pwd)
env_file="${deployment_dir}/.env"

if [ ! -f "${env_file}" ]; then
  cp "${deployment_dir}/.env.example" "${env_file}"
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
  *) backend_path="${deployment_dir}/${backend_dir}" ;;
esac

has_backend_source() {
  [ -f "$1/deployment/dockerfile" ] && [ -f "$1/ogrre/main.py" ]
}

if [ "${backend_auto_clone}" = "true" ] && ! has_backend_source "${backend_path}"; then
  mkdir -p "$(dirname "${backend_path}")"
  git clone "${backend_url}" "${backend_path}"
fi

compose_files="-f ${deployment_dir}/docker-compose.dev.yml"

case "${backend_mode}" in
  source)
    if ! has_backend_source "${backend_path}"; then
      echo "BACKEND_MODE=source requires backend source at ${backend_path}" >&2
      exit 1
    fi
    compose_files="${compose_files} -f ${deployment_dir}/docker-compose.source.yml"
    ;;
  image)
    ;;
  auto)
    if has_backend_source "${backend_path}"; then
      compose_files="${compose_files} -f ${deployment_dir}/docker-compose.source.yml"
    fi
    ;;
  *)
    echo "Invalid BACKEND_MODE='${backend_mode}'. Use auto, image, or source." >&2
    exit 1
    ;;
esac

storage_backend=$(printf "%s" "${STORAGE_BACKEND:-local}" | tr "[:upper:]" "[:lower:]")
if [ "${storage_backend}" = "google" ]; then
  if [ -z "${STORAGE_SERVICE_KEY:-}" ]; then
    echo "STORAGE_BACKEND=google requires STORAGE_SERVICE_KEY to be set." >&2
    exit 1
  fi

  storage_key_host_path=""
  case "${STORAGE_SERVICE_KEY}" in
    /*)
      if [ -f "${STORAGE_SERVICE_KEY}" ]; then
        storage_key_host_path="${STORAGE_SERVICE_KEY}"
      fi
      checked_paths="${STORAGE_SERVICE_KEY}"
      ;;
    *)
      checked_paths="${deployment_dir}/${STORAGE_SERVICE_KEY}
${backend_path}/${STORAGE_SERVICE_KEY}
${backend_path}/ogrre/${STORAGE_SERVICE_KEY}"
      for candidate in \
        "${deployment_dir}/${STORAGE_SERVICE_KEY}" \
        "${backend_path}/${STORAGE_SERVICE_KEY}" \
        "${backend_path}/ogrre/${STORAGE_SERVICE_KEY}"
      do
        if [ -f "${candidate}" ]; then
          storage_key_host_path="${candidate}"
          break
        fi
      done
      ;;
  esac

  if [ -z "${storage_key_host_path}" ]; then
    echo "Unable to find STORAGE_SERVICE_KEY file '${STORAGE_SERVICE_KEY}'." >&2
    echo "Because STORAGE_BACKEND=google, OGRRE must be able to mount a Google storage service-account key into the backend container." >&2
    echo "Provide the key file in one of the checked locations, or set STORAGE_SERVICE_KEY to an absolute path." >&2
    echo "Checked:" >&2
    printf "%s\n" "${checked_paths}" | sed "s/^/  - /" >&2
    exit 1
  fi

  key_filename=$(basename "${STORAGE_SERVICE_KEY}")
  if [ -z "${key_filename}" ] || [ "${key_filename}" = "." ] || [ "${key_filename}" = ".." ]; then
    echo "Invalid STORAGE_SERVICE_KEY path: ${STORAGE_SERVICE_KEY}" >&2
    exit 1
  fi

  container_path="/code/ogrre/${key_filename}"
  credential_override_file=$(mktemp "${TMPDIR:-/tmp}/ogrre-compose-XXXXXX.yml")
  quote_yaml() {
    printf "'%s'" "$(printf "%s" "$1" | sed "s/'/'\"'\"'/g")"
  }
  {
    echo "services:"
    echo "  backend:"
    echo "    environment:"
    printf "      STORAGE_SERVICE_KEY: %s\n" "$(quote_yaml "${container_path}")"
    printf "      GOOGLE_APPLICATION_CREDENTIALS: %s\n" "$(quote_yaml "${container_path}")"
    echo "    volumes:"
    echo "      - type: bind"
    printf "        source: %s\n" "$(quote_yaml "${storage_key_host_path}")"
    printf "        target: %s\n" "$(quote_yaml "${container_path}")"
    echo "        read_only: true"
  } > "${credential_override_file}"
  compose_files="${compose_files} -f ${credential_override_file}"
  echo "Mounting Google storage service key into ${container_path}"
fi

cd "${repo_root}"
# shellcheck disable=SC2086
docker compose --env-file "${env_file}" ${compose_files} up -d --build "$@"
