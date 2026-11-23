#!/usr/bin/env bash
set -euo pipefail
ROOT="/tmp/wazuh-industrial-soc-validation-20261123-1317"
DEPLOY="$ROOT/deployment/industrial-soc-wazuh-4.14.10"
RUNTIME="/private/tmp/industrial-soc-wazuh-41410"
set -a
. "$RUNTIME/secrets.env"
set +a
python3 "$DEPLOY/prepare-runtime-config.py"
cd "$ROOT"
exec yarn start --no-base-path --config "$RUNTIME/dashboard-config.yml"
