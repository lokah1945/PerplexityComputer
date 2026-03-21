# SKILLS.md — Reusable Workflows
# Gemini membaca ini dan mengaktifkan skill yang relevan secara otomatis

---

## skill: new-feature
**Trigger:** "buat fitur", "tambah feature", "implement"
**Steps:**
1. Baca semua file yang relevan via `filesystem:read_file`
2. Paralel: `pplx_code_research` untuk pattern + `pplx_fast_search` untuk docs terbaru
3. Synthesize: buat Implementation Plan Artifact (Planning Mode)
4. Tunggu approval di Inbox
5. `pplx_code_agent` untuk generate kode lengkap
6. Tulis file via `filesystem:write_file`
7. Jalankan `pnpm test` — jika gagal, masuk ke skill: debug-loop
8. Update AGENTS.md dengan pattern baru

---

## skill: debug-loop
**Trigger:** "debug", "error", "fix bug", "ada error"
**Steps:**
1. Baca file error via `filesystem:read_file`
2. `pplx_debug_loop(error_log, relevant_code)` — dapatkan root cause + patch
3. Apply patch via `filesystem:write_file`
4. Jalankan test ulang
5. Jika masih gagal: iterasi max 5x, gunakan `pplx_code_agent` di iterasi ke-3
6. Catat error dan solusi ke `.brain/memory/errors.md`

---

## skill: deep-research
**Trigger:** "research", "analisis", "bandingkan", "carikan"
**Steps:**
1. Decompose topik menjadi 3-5 subtopik
2. `pplx_parallel_agents` — semua subtopik diresearch paralel dengan preset `deep-research`
3. Synthesize semua hasil menjadi laporan terstruktur
4. Simpan ke file markdown di workspace

---

## skill: refactor
**Trigger:** "refactor", "cleanup", "optimasi", "migrate"
**Steps:**
1. `filesystem:list_directory` untuk scan struktur
2. Baca semua file target via `filesystem:read_file`
3. `pplx_parallel_agents`: analisis code quality + cari pattern baru + cek breaking changes
4. Buat refactor plan (Planning Mode)
5. `pplx_code_agent` untuk implementasi refactor
6. Test coverage sebelum dan sesudah

---

## skill: architecture-design
**Trigger:** "desain arsitektur", "rancang sistem", "architectural"
**Steps:**
1. `pplx_parallel_agents` dengan 4 sub-task paralel:
   - Research system design patterns terbaru
   - Research teknologi yang relevan
   - Analisis trade-offs
   - Cari case study implementasi
2. `pplx_code_agent` dengan preset `advanced-deep-research` untuk document arsitektur
3. Generate diagram ASCII + implementasi plan
