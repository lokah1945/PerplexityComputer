# Implementation Plan: Super-Orchestrator v5.0 — "You-First Optimization"

Phase 5 bertujuan untuk menurunkan biaya operasional lebih jauh lagi dengan memindahkan fase **Information Gathering** (Scouting) ke You.com sebelum menyentuh model Perplexity yang mahal.

## Proposed Changes

### 1. New Component: YouScouting Layer
Memperkenalkan fase "Scouting" otomatis yang menggunakan You.com untuk pencarian awal.

#### [NEW] [scout.ts](file:///d:/Project/PerplexityComputer/super-orchestrator/mcp/perplexity-agent/src/intelligence/scout.ts)
- Implementasi wrapper untuk `you-search` dan `you-research`.
- Logika untuk mengekstraksi URL relevan dan mengambil konten penuh via `you-contents`.

### 2. Router Optimization
#### [MODIFY] [router.ts](file:///d:/Project/PerplexityComputer/super-orchestrator/mcp/perplexity-agent/src/router.ts)
- Tambahkan preset `scout-first`.
- Update `smartRoute` untuk mendeteksi tugas yang bisa diselesaikan 100% oleh You.com.

### 3. Agent Orcherstration
#### [MODIFY] [agents.ts](file:///d:/Project/PerplexityComputer/super-orchestrator/mcp/perplexity-agent/src/agents.ts)
- Integrasikan `YouScout` ke dalam `callAgent`.
- Jika `scoutFirst` aktif, lakukan pencarian You.com terlebih dahulu dan sertakan hasilnya sebagai "Clean Context" ke Perplexity.

## Verification Plan

### Automated Tests
- `npm run test:scout`: Verifikasi You.com mengembalikan hasil yang valid.
- `pplx_telemetry`: Pantau penurunan biaya pada model `deep-research` setelah Scouting aktif.

### Manual Verification
- Cek log orkestrasi: "Scouting via You.com complete. Injecting enriched context to Perplexity."
