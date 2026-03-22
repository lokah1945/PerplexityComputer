# SKILLS.md — Reusable Workflows (Super-Orchestrator v4.0)

---

## skill: autonomous-self-improvement
**Trigger:** "evolve", "optimize brain", "belajar dari kegagalan ini"
**Steps:**
1. **Telemetry Slicing**: Identifikasi pola kegagalan dari run terakhir.
2. **Textual Gradient**: Gunakan `pplx_optimize_instructions` untuk menganalisa bagian `AGENTS.md` yang perlu diperbaiki.
3. **Draft Proposal**: Sistem membuat draft perubahan pada instruksi.
4. **Eval Gate**: Jalankan `pplx_eval_benchmark` terhadap Golden Set.
5. **Promotion**: Jika skor benchmark naik, aplikasikan perubahan ke `AGENTS.md`.

---

## skill: maintain-golden-set
**Trigger:** "task sukses besar", "ini patokan", "save golden"
**Steps:**
1. **Capture**: Ambil trace lengkap dari tugas yang sukses.
2. **Archive**: Gunakan `pplx_save_golden_trace` untuk menyimpannya sebagai benchmark masa depan.
3. **Weighting**: Berikan bobot tinggi agar optimizer mementingkan pola ini.

---

## skill: heavy-coding-v4
**Trigger:** "fitur kompleks", "arsitektur berat"
**Steps:**
1. **Memory Consultation**: `pplx_think` + Scouting MongoDB.
2. **Strategy Prioritization**: Gunakan "Golden Traces" sebagai referensi struktur.
3. **Execution**: Coding dengan model Opus 4.6 + Deep Context.
4. **Auto-Reflect**: Jalankan loop `Reflexion` jika ada error saat build.
5. **Archiving**: Simpan pelajaran baru ke Intelligence Hub.
