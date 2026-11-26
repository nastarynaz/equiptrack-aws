#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^https?://[^/?#]+(/[^?#]*)?$ ]]; then
  printf 'Usage: %s <api-base-url>\n' "$0" >&2
  exit 2
fi
base_url=${1%/}
response=$(mktemp)
trap 'rm -f "$response"' EXIT
created='{"name":"Digital Projector","category":"Electronics","quantity":5,"condition":"Good"}'
updated='{"name":"Digital Projector","category":"Electronics","quantity":7,"condition":"Maintenance"}'

request() {
  local label=$1 expected=$2 method=$3 path=$4 actual
  local -a args=(--silent --show-error --max-time 20 --output "$response" --write-out '%{http_code}' --request "$method")
  if [[ $# -eq 5 ]]; then
    args+=(--header 'Content-Type: application/json' --data-binary "$5")
  fi
  if ! actual=$(curl "${args[@]}" "$base_url$path"); then
    printf 'FAIL %s (transport error)\n' "$label" >&2
    exit 1
  fi
  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL %s (expected %s, got %s)\n' "$label" "$expected" "$actual" >&2
    exit 1
  fi
  printf 'PASS %s (%s)\n' "$label" "$actual"
  sleep 1.1
}

verify_record() {
  python3 - "$response" "$1" "$2" <<'PY'
import json
import sys
from uuid import UUID

with open(sys.argv[1]) as stream:
    record = json.load(stream)
expected = json.loads(sys.argv[2])
identifier = record.get("equipment_id")
if (
    not isinstance(identifier, str)
    or str(UUID(identifier)) != identifier
    or (sys.argv[3] and identifier != sys.argv[3])
    or any(record.get(field) != value for field, value in expected.items())
    or type(record.get("quantity")) is not int
):
    sys.exit("Unexpected equipment record")
print(identifier)
PY
}

request 'Create equipment' 201 POST /equipment "$created"
if ! id=$(verify_record "$created" ''); then
  printf 'FAIL created equipment payload\n' >&2
  exit 1
fi
item="/equipment/$id"
request 'Read equipment' 200 GET "$item"
verify_record "$created" "$id" >/dev/null || { echo 'FAIL read equipment payload' >&2; exit 1; }
request 'Update equipment' 200 PUT "$item" "$updated"
verify_record "$updated" "$id" >/dev/null || { echo 'FAIL updated equipment payload' >&2; exit 1; }
request 'Read updated equipment' 200 GET "$item"
verify_record "$updated" "$id" >/dev/null || { echo 'FAIL persisted update' >&2; exit 1; }
printf 'PASS updated values persisted\n'
request 'Delete equipment' 204 DELETE "$item"
[[ ! -s "$response" ]] || { echo 'FAIL delete response body is not empty' >&2; exit 1; }
request 'Read deleted equipment' 404 GET "$item"
request 'Reject Boolean quantity' 400 POST /equipment '{"name":"Projector","category":"Electronics","quantity":true,"condition":"Good"}'
request 'Update nonexistent equipment' 404 PUT "$item" "$updated"
request 'Delete nonexistent equipment' 404 DELETE "$item"
