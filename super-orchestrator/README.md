# Super-Orchestrator (Production-Ready, New-Only)

Implementasi clean-slate dari blueprint, tanpa menjaga backward compatibility.

## Komponen

- `.brain/AGENTS.md` dan `.brain/SKILLS.md` untuk memory + workflow
- `mcp/perplexity-agent` untuk MCP server produksi
- `scripts/bootstrap-debian.sh` untuk provisioning Debian 12
- `scripts/run-prod.sh` untuk startup runtime

## Tool MCP yang tersedia

- `pplx_fast_search`
- `pplx_code_research`
- `pplx_code_agent`
- `pplx_parallel_agents`
- `pplx_debug_loop`
- `pplx_architecture`
- `pplx_autonomous_loop`
- `pplx_healthcheck`

## Hardening yang sudah aktif

- Validasi konfigurasi environment saat startup
- Timeout request API
- Retry exponential backoff untuk 408/429/5xx
- Concurrency limit untuk parallel agents
- Logging JSON terstruktur

## Quick Start Debian 12

```bash
cd super-orchestrator
chmod +x scripts/bootstrap-debian.sh scripts/run-prod.sh
./scripts/bootstrap-debian.sh
# edit mcp/perplexity-agent/.env
./scripts/run-prod.sh
```

## Build Manual

```bash
cd mcp/perplexity-agent
npm ci
npm run build
```

## Env Wajib

Lihat `mcp/perplexity-agent/.env.example`. Minimal wajib:

- `PERPLEXITY_API_KEY`

Opsional produksi:

- `PPLX_BASE_URL`
- `PPLX_HTTP_TIMEOUT_MS`
- `PPLX_MAX_RETRIES`
- `PPLX_CONCURRENCY`
- `LOG_LEVEL`
