# Blueprint Integrasi You.com MCP ke PerplexityComputer — Super-Orchestrator Antigravity v2

## Executive Summary

You.com menyediakan MCP Server gratis (tanpa API key, tanpa signup) dengan tiga tools powerful: `you-search`, `you-contents`, dan `you-research`. Dikombinasikan dengan $100 free credit yang bisa diklaim di you.com/platform, You.com menjadi kandidat ideal sebagai **lapisan web intelligence** kedua di samping Perplexity Agent API yang sudah ada di repo `PerplexityComputer`. Arsitektur baru ini memposisikan Gemini Flash (unlimited via Antigravity) sebagai orchestrator murni, dengan dua sub-agent paralel: You.com untuk riset real-time dan Perplexity untuk coding execution.

***

## Mengenal You.com MCP: Apa yang Didapat Secara Gratis

You.com MCP Server bisa langsung digunakan **tanpa API key, tanpa signup, tanpa konfigurasi billing** dengan menambahkan satu URL ke `mcp_config.json`:

```json
{
  "mcpServers": {
    "ydc-server": {
      "type": "http",
      "url": "https://api.you.com/mcp"
    }
  }
}
```

Atau via NPX lokal (untuk STDIO transport seperti di Antigravity):
```json
{
  "ydc-server": {
    "command": "npx",
    "args": ["@youdotcom-oss/mcp"]
  }
}
```

### Tiga Tools yang Tersedia

| Tool | Fungsi | Kapan Digunakan |
|---|---|---|
| `you-search` | Web + news search dengan advanced filtering | Lookup cepat, cek versi library, news terbaru, cari domain spesifik |
| `you-contents` | Ekstrak full page content dari URL (markdown/HTML) | Baca dokumentasi, scrape halaman spesifik, analisis konten |
| `you-research` | Agentic research multi-step dengan sintesis dan sitasi | Riset mendalam, analisis trade-offs, research yang membutuhkan cross-referencing |



### Level Effort `you-research`

`you-research` mendukung empat level kedalaman yang bisa dikontrol:

| Level | Kecepatan | Token | Kapan Pakai |
|---|---|---|---|
| `lite` | ~2-5 detik | Rendah | Quick synthesis, answer sederhana |
| `standard` | ~10-15 detik | Medium | Research coding, best practice |
| `deep` | ~20-30 detik | Tinggi | Arsitektur, trade-off analysis |
| `exhaustive` | ~60-120 detik | Sangat tinggi | Research investigatif, multi-sumber kompleks |

***

## Biaya: Gratis vs $100 Credit

You.com memberikan $100 free credit saat signup pertama di platform. Free tier tanpa API key memiliki rate limit lebih rendah, sementara dengan API key (menggunakan credit) mendapat rate limit lebih tinggi.

Estimasi biaya Research API berdasarkan data benchmark:

| Mode | Estimasi Biaya | Setara dengan $100 |
|---|---|---|
| Search (you-search) | ~$0.50-1/1K calls | ~100K-200K requests |
| Research `lite` | ~$6.50/1K calls | ~15K research calls |
| Research `standard` | ~$20-50/1K calls | ~2K-5K research calls |
| Research `exhaustive` | ~$300/1K calls | ~333 research calls |

**Rekomendasi untuk trial $100**: Gunakan `you-search` dan `you-research` level `lite`/`standard` untuk coding workflow sehari-hari. Reserve `deep`/`exhaustive` hanya untuk architecture research yang benar-benar kompleks.

***

## Posisi You.com dalam Arsitektur PerplexityComputer

Masalah utama di repo saat ini adalah `super-orchestrator/mcp/perplexity-agent` hanya punya **satu sumber intelijen** (Perplexity Agent API). Semua request — dari lookup sederhana sampai riset mendalam — disalurkan ke endpoint yang sama dengan biaya berbeda. Dengan menambahkan You.com sebagai lapisan kedua, Gemini bisa memilih tool yang paling cost-efficient untuk setiap situasi.

### Arsitektur Baru: Dual-Intelligence Layer

```
Google Antigravity (Gemini Flash — Unlimited, FREE)
        │
        ├─── TIER 1: You.com MCP (Gratis / Low Cost)
        │     ├── you-search       → Quick lookup, versi library, news
        │     ├── you-contents     → Baca dokumentasi, URL extraction
        │     └── you-research     → Pre-research sebelum coding
        │
        ├─── TIER 2: Perplexity MCP (Berbayar, High Quality)
        │     ├── pplx_code_agent  → Generate kode (Claude Opus)
        │     ├── pplx_debug_loop  → Debug + patch
        │     └── pplx_parallel_agents → Multi-topic coding research
        │
        └─── TIER 3: Local Sandbox
              └── local_computer   → Docker exec, file R/W
```

Gemini sebagai orchestrator **tidak menulis kode**. Dia hanya memutuskan: "Apakah ini butuh You.com dulu, atau langsung Perplexity, atau paralel keduanya?"

***

## Perubahan yang Diperlukan di Repo

### 1. Update `super-orchestrator/mcp_config.json`

Tambahkan `ydc-server` ke konfigurasi yang sudah ada:

```json
{
  "mcpServers": {
    "perplexity-agent": {
      "command": "node",
      "args": ["./mcp/perplexity-agent/dist/index.js"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-XXXX",
        "PPLX_BASE_URL": "https://api.perplexity.ai/v1",
        "PPLX_CONCURRENCY": "4"
      }
    },
    "ydc-server": {
      "command": "npx",
      "args": ["@youdotcom-oss/mcp"],
      "env": {
        "api_key": "ydcXXXXXXXXXXX"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/fahri/projects"],
      "env": {}
    }
  }
}
```

Untuk free tier tanpa API key, hapus field `env` dari `ydc-server`.

### 2. Update `super-orchestrator/.brain/AGENTS.md`

Tambahkan tabel routing baru yang mencakup You.com tools:

```markdown
## Protokol Routing: You.com vs Perplexity
 
| Kondisi | Tool | Alasan |
|---|---|---|
| Cek versi library, syntax, quick fact | `you-search` | Gratis, cepat, real-time |
| Baca dokumentasi dari URL tertentu | `you-contents` | Gratis, ekstrak konten bersih |
| Pre-research sebelum coding | `you-research` (standard) | Murah, multi-source synthesis |
| Architecture research mendalam | `you-research` (deep) | Worth cost untuk keputusan besar |
| Generate/refactor kode kompleks | `pplx_code_agent` | Claude Opus, terbaik untuk kode |
| Debug error + patch | `pplx_debug_loop` | Cepat, presisi tinggi |
| Multi-topic coding research | `pplx_parallel_agents` | Paralel, efisien waktu |
```

### 3. Update `super-orchestrator/.brain/SKILLS.md`

Tambahkan workflow baru yang mengoptimalkan penggunaan You.com:

```markdown
## skill: smart-research-first
**Trigger:** Semua task coding sebelum eksekusi
**Steps:**
1. `you-search` untuk cek versi library terbaru dan compatibility
2. `you-research` (standard) untuk riset pattern dan best practice
3. Synthesize hasil → buat implementation plan
4. `pplx_code_agent` untuk eksekusi kode berbasis hasil riset
5. Test → jika gagal: `pplx_debug_loop`
 
## skill: doc-extract
**Trigger:** "baca docs", "lihat dokumentasi", "extract dari URL"
**Steps:**
1. `you-contents` untuk ekstrak konten dari URL docs
2. Parse hasil menjadi context yang relevan
3. Lanjutkan ke task coding yang membutuhkan docs tersebut
 
## skill: playwright-smart
**Trigger:** "playwright", "browser automation", "selector"
**Steps:**
1. `you-search(query="playwright latest changelog version")` → cek versi
2. `you-contents(url="https://playwright.dev/docs/...")` → ekstrak docs terbaru
3. `pplx_code_agent` untuk implementasi dengan konteks docs aktual
```

### 4. Update `.antigravity/settings.json` — Global Skills

Tambahkan section You.com ke dalam Global Skills Antigravity:

```markdown
## MCP You.com (@mcp:ydc-server) — PRIORITASKAN INI DULU
- `you-search` → Untuk SEMUA lookup pertama: versi, syntax, API docs. SELALU coba ini sebelum Perplexity.
- `you-contents` → Ekstrak konten dari URL: dokumentasi, GitHub README, blog post.
- `you-research` → Pre-research sebelum coding. Gunakan effort=standard untuk coding task biasa, effort=deep untuk arsitektur.
 
## Hierarki Penggunaan Tool (WAJIB IKUTI URUTAN INI):
1. `you-search` / `you-contents` dulu (gratis/murah)
2. `you-research` jika butuh synthesis (medium cost)
3. `pplx_code_agent` / `pplx_debug_loop` untuk eksekusi kode (premium)
4. `pplx_parallel_agents` hanya jika task benar-benar bisa diparalelkan
 
## Aturan Efisiensi Biaya:
- JANGAN panggil `pplx_code_agent` tanpa riset konteks dulu via You.com
- JANGAN panggil `pplx_code_research` jika `you-research(effort=standard)` sudah cukup
- Simpan Perplexity premium untuk: generate kode, debug loop, arsitektur decision
```

***

## Workflow Coding End-to-End yang Optimal

Berikut contoh konkret bagaimana Gemini Flash akan beroperasi dengan setup dual-intelligence:

### Contoh: Task "Implement Playwright proxy pool dengan rotation"

**Lama (sebelum You.com):**
```
pplx_code_research → pplx_code_agent → test → pplx_debug_loop
Biaya: ~3-5 Perplexity API calls (semua premium)
```

**Baru (dengan You.com):**
```
you-search("playwright proxy rotation 2026")           ← GRATIS
you-contents("https://playwright.dev/docs/network")    ← GRATIS
you-research("best practices proxy pool playwright")   ← MURAH (~$0.02)
pplx_code_agent(dengan konteks dari You.com)           ← PREMIUM (tapi lebih akurat)
test → jika gagal:
  you-search("playwright error: <error message>")       ← GRATIS
  pplx_debug_loop(error, code)                          ← PREMIUM
Biaya: 1-2 Perplexity API calls (turun 50-70%)
```

Penghematan signifikan terjadi karena `pplx_code_agent` menerima **konteks yang sudah diproses** dari You.com, sehingga menghasilkan kode yang lebih akurat dalam satu shot — mengurangi kebutuhan debug loop.

***

## Keunggulan You.com vs Perplexity untuk Research

You.com Research API menjadi #1 pada benchmark DeepSearchQA pada Maret 2026, dengan akurasi dan F1 score tertinggi di industri. Untuk perbandingan langsung dengan Perplexity:

| Aspek | You.com Research API | Perplexity Sonar Deep Research |
|---|---|---|
| Benchmark | #1 DeepSearchQA, BrowseComp, FRAMES | 93.9% akurasi |
| Effort levels | lite / standard / deep / exhaustive / frontier | Tidak ada (single tier) |
| MCP free tier | Ya, tanpa API key | Tidak ada free tier |
| Fokus terbaik | Web research, multi-source synthesis | Coding research, grounded answers |
| Latency | 15-30s (agentic loop) | Lebih cepat untuk single queries |
| Cost efficiency | Jauh lebih murah untuk research | Optimal untuk code generation |

Dua tool ini saling melengkapi, bukan bersaing. You.com unggul untuk riset dan web intelligence; Perplexity unggul untuk eksekusi kode dan debugging.

***

## Kompatibilitas dengan AI Coding Tool Lain

Karena You.com MCP menggunakan standar MCP universal via STDIO atau HTTP, integrasi ini bekerja langsung di semua AI coding tools tanpa modifikasi tambahan:

| Tool | Cara Integrasi | Status |
|---|---|---|
| **Antigravity (Gemini)** | Via `mcp_config.json` STDIO | ✅ Langsung pakai |
| **Claude Code** | `claude mcp add --transport http ydc-server https://api.you.com/mcp` | ✅ Langsung pakai |
| **VS Code Copilot** | `code --add-mcp '{"name":"ydc-server","url":"https://api.you.com/mcp"}'` | ✅ Langsung pakai |
| **Cursor IDE** | Via `mcp_config.json` (tanpa field `type`) | ✅ Langsung pakai |
| **Windsurf** | Via MCP installation guide | ✅ Langsung pakai |
| **JetBrains IDEs** | Via MCP installation guide (butuh AI Assistant) | ✅ Langsung pakai |

 Satu konfigurasi `mcp_config.json`, bisa dipakai di semua platform coding.

***

## Panduan Klaim $100 Credit You.com

1. Buka you.com/platform di tab private/incognito
2. Daftar dengan email baru (belum pernah dipakai di you.com)
3. $100 free credit otomatis terkreditkan tanpa perlu kartu kredit
4. Buat API key di menu "API Keys"
5. Tambahkan ke `mcp_config.json` di field `api_key` → rate limit meningkat signifikan

Tanpa API key pun sudah bisa langsung digunakan untuk development dan testing — rate limit free tier cukup untuk workflow sehari-hari.

***

## Rencana Implementasi: 3 Fase

### Fase 1 — Setup Dasar (30 menit)
1. Tambahkan `ydc-server` ke `mcp_config.json` (tanpa API key dulu)
2. Test di Antigravity: `"Search web untuk versi terbaru Playwright"` → harus memanggil `you-search`
3. Test extraction: `"Ekstrak konten dari https://playwright.dev/docs/network"` → harus memanggil `you-contents`

### Fase 2 — Update Brain Files (1 jam)
1. Update `AGENTS.md` dengan tabel routing baru yang include You.com
2. Update `SKILLS.md` dengan skill `smart-research-first` dan `doc-extract`
3. Update `.antigravity/settings.json` dengan hierarki tool yang baru

### Fase 3 — Klaim API Key dan Optimasi (ongoing)
1. Klaim $100 credit di you.com/platform
2. Tambahkan API key ke konfigurasi untuk higher rate limits
3. Monitor biaya: You.com untuk research, Perplexity untuk coding
4. Fine-tune effort level di `you-research` berdasarkan observasi kualitas hasil

***

## Catatan Teknis: Free Tier vs API Key

You.com MCP server mendukung dua transport: **HTTP remote** (disarankan untuk production) dan **STDIO via NPX** (untuk IDE lokal). Antigravity menggunakan STDIO karena format `mcp_config.json`-nya menggunakan `command: npx`.

Saat menggunakan `npx @youdotcom-oss/mcp` tanpa API key, server berjalan secara lokal dan menghubungi `https://api.you.com` di background. Rate limit free tier tidak didokumentasikan secara publik, tapi berdasarkan pola MCP tools sejenis, cukup for 50-100 request/hari for development use. Dengan API key dari $100 credit, limit ini naik signifikan dan cocok for workflow produksi.
