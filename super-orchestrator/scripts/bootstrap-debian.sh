#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_DIR="${ROOT_DIR}/mcp/perplexity-agent"

echo "[1/5] Installing system dependencies"
sudo apt-get update
sudo apt-get install -y curl ca-certificates gnupg

if ! command -v node >/dev/null 2>&1; then
  echo "[2/5] Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[2/5] Node.js already installed"
fi

echo "[3/5] Installing MCP dependencies"
cd "${MCP_DIR}"
npm ci

echo "[4/5] Building MCP server"
npm run build

if [ ! -f "${MCP_DIR}/.env" ]; then
  echo "[5/5] Creating .env from template"
  cp "${MCP_DIR}/.env.example" "${MCP_DIR}/.env"
  echo "Please edit ${MCP_DIR}/.env and set PERPLEXITY_API_KEY."
else
  echo "[5/5] .env already exists"
fi

echo "Bootstrap selesai."
