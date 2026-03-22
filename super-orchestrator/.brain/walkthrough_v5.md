# Walkthrough: Super-Orchestrator v5.0 — "You-First Optimization"

## Apa yang Baru?
Versi 5.0 memperkenalkan konsep **Scouting Layer** menggunakan You.com. Ini adalah strategi pertahanan biaya tertinggi yang pernah kita buat.

### 1. YouScout: The Intelligent Vanguard
Sistem sekarang memiliki modul `YouScout` yang berfungsi sebagai "pemandu jalan" sebelum Perplexity Agent dipanggil.
- **Master Scout Pass**: Melakukan riset cepat (You.com Research API) dan pencarian web (You.com Search API) secara simultan.
- **Context Synthesis**: Hasil dari You.com disintesis menjadi context "bersih" yang kemudian dikirim ke Perplexity. Ini memastikan Perplexity tidak perlu lagi melakukan pencarian dasar yang mahal.

### 2. Hybrid Orchestration Logic
Di dalam `agents.ts`, logika pemanggilan agent kini memiliki alur:
1.  **Memory Recall**: Ambil pelajaran dari MongoDB.
2.  **You Scouting**: (Untuk tugas Research) Lakukan scouting via You.com.
3.  **Perplexity Execution**: Jalankan penalaran tingkat tinggi menggunakan context dari langkah 1 & 2.

### 3. Cost Efficiency Benchmark
Dengan Scouting Layer ini, kita memindahkan beban "Initial Information Retrieval" dari Perplexity ($$$) ke You.com ($), yang secara drastis akan menurunkan tagihan "Uncached Input Tokens" Anda.

## Cara Mengaktifkan
1. Tambahkan `YOU_API_KEY` di file `.env` Anda.
2. Restart MCP Server.
3. Gunakan tool `pplx_scout` untuk riset murni tanpa menyentuh Perplexity, atau biarkan `smartRoute` yang menentukan kapan scouting otomatis diperlukan.

## Summary of Changes
- **NEW**: `src/intelligence/scout.ts` (The Scouting Engine).
- **UPDATED**: `src/agents.ts` (Integrated Hybrid Prompting).
- **UPDATED**: `src/index.ts` (New `pplx_scout` tool).
- **UPDATED**: `src/router.ts` (Trigger scouting for research tasks).
