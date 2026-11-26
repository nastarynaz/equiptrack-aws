#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -e .env ]]; then
  (umask 077; printf 'DB_PASSWORD=%s\n' "$(openssl rand -hex 24)" > .env)
fi
docker compose up --build --detach --wait
