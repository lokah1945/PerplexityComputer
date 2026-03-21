#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_DIR="${ROOT_DIR}/mcp/perplexity-agent"

cd "${MCP_DIR}"

if [ ! -f ".env" ]; then
  echo ".env belum ada. Jalankan scripts/bootstrap-debian.sh dulu."
  exit 1
fi

set -a
source .env
set +a

exec node dist/index.js
