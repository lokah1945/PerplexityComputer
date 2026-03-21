# AGENTS.md — Project Brain
# Auto-updated setelah setiap task selesai. JANGAN hapus manual.

## Stack & Environment
- OS: Debian Linux
- Runtime: Node.js 20, TypeScript 5.4
- Package manager: pnpm
- Project dir: /home/fahri/projects/
- Test runner: vitest (unit), playwright (e2e)

## Protokol Routing Perplexity Sub-Agent

| Kondisi | Tool yang Digunakan | Alasan |
|---|---|---|
| Lookup versi library, cek compatibility | `pplx_fast_search` | Grok 4.1, 1 step, hemat |
| Research pattern/best practice coding | `pplx_code_research` | GPT-5.2, 10 steps, detail |
| Generate/refactor kode kompleks | `pplx_code_agent` | Claude Opus 4.6, terbaik |
| Multi-topic research paralel | `pplx_parallel_agents` | Paralel, hemat waktu |
| Debug error + patch | `pplx_debug_loop` | GPT-5.1, cepat, tepat |

## Aturan Approval Gate
HARUS minta review sebelum:
- `rm -rf` apapun
- `git push` ke remote branch manapun
- `npm publish` / `pnpm publish`
- Modifikasi file `.env` atau `*.secret.*`

LANGSUNG PROCEED (tidak perlu tanya):
- Install package baru
- Tulis/modifikasi file kode
- Jalankan test
- Buat branch baru

## Pattern yang Ditemukan
<!-- Diisi otomatis oleh Gemini setelah setiap task -->

## Error yang Pernah Terjadi & Solusinya
<!-- Diisi otomatis, mencegah error yang sama terulang -->
