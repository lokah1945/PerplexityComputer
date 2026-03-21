# Blueprint Final: Super-Orchestrator Melampaui Perplexity Computer

## Mengapa Perplexity Computer Mahal dan Apa yang Bisa Dibangun Sebagai Penggantinya

Perplexity Computer adalah sistem cloud-hosted yang mengorkestrasikan 19 model AI secara paralel — Claude Opus 4.6 sebagai reasoning engine, Gemini untuk deep research, Grok untuk task cepat, GPT-5.2 untuk long-context recall. Harganya $200/bulan hanya untuk subscription Max, ditambah sistem kredit berbasis usage — dan kredit bisa habis sangat cepat: satu sesi coding berat bisa menguras 40% dari 10.000 kredit bulanan dalam waktu kurang dari satu jam. Bahkan builder.io melaporkan kasus ekstrem di mana satu proyek website menghabiskan $200 ekstra kredit di luar subscription hanya dalam dua hari.[^1][^2][^3]

Kunci filosofi Perplexity Computer diungkapkan oleh CEO Aravind Srinivas: **"The orchestration is the product. The model is a tool."** — inilah yang perlu direplikasi. Bukan modelnya, tapi harness orkestrasinya.[^4]

Sistem yang dibangun di sini mereplikasi **semua** kapabilitas tersebut dengan biaya yang jauh lebih terkontrol, dengan Gemini 3.1 Pro via Antigravity sebagai orkestrator gratis, dan Perplexity Agent API sebagai sub-agent spesialis yang hanya dipanggil saat dibutuhkan.

***

## Anatomi Perplexity Computer: Apa Saja yang Perlu Direplikasi

Berdasarkan dokumentasi resmi dan analisis mendalam, Perplexity Computer memiliki 7 kapabilitas inti yang harus ada di sistem pengganti:[^5][^6][^1]

| Kapabilitas | Bagaimana Computer Melakukannya | Implementasi Kita |
|---|---|---|
| **Multi-model routing** | Claude Opus 4.6 routing ke 19 model[^1] | Gemini 3.1 Pro routing ke Perplexity Agent API (4 preset) |
| **Parallel sub-agents** | Spawn agent paralel otomatis[^7] | `Promise.allSettled()` ke Perplexity Agent API |
| **Persistent memory** | Memory lintas session, ingat preferensi[^8] | `AGENTS.md` + file `.brain/` lokal |
| **Skills (reusable workflows)** | Custom skills yang auto-aktif[^6] | `SKILLS.md` + prompt injection ke Gemini |
| **Isolated compute** | Real filesystem, real browser, sandbox[^4] | Workspace Antigravity + MCP filesystem + exec |
| **Approval gate** | Check-in hanya jika benar-benar stuck[^1] | Gemini Inbox di Agent Manager[^9] |
| **Autonomous loop** | Berjalan jam bahkan bulan tanpa interaksi[^1] | State machine: plan → research → code → test → fix → done |

**Keunggulan tambahan yang Computer TIDAK miliki tapi sistem kita punya:**
- **Biaya orchestrator = nol** (Gemini 3.1 Pro via akun AI Pro yang sudah ada)[^10]
- **Akses filesystem lokal langsung** tanpa sandbox cloud yang terisolasi
- **Custom MCP tools tak terbatas** — tambah koneksi ke sistem apapun
- **Tidak ada watermark** "Created with Perplexity Computer"[^11]
- **Kontrol routing penuh** — kamu tentukan model mana untuk task apa

***

## Arsitektur Final: 3 Lapisan

```
╔══════════════════════════════════════════════════════════════════╗
║         LAPISAN 1: MISSION CONTROL (Antigravity Agent Manager)   ║
║                                                                  ║
║  Inbox          Workspace A        Workspace B     Playground    ║
║  (Approval)     (Project Alpha)    (Project Beta)  (Eksperimen)  ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │         ORKESTRATOR: Gemini 3.1 Pro Customtools         │    ║
║  │  • Planning Mode: Buat Implementation Plan dulu         │    ║
║  │  • Fast Mode: Langsung eksekusi untuk task kecil        │    ║
║  │  • Parallel function calling: panggil N tools sekaligus │    ║
║  │  • Baca AGENTS.md + SKILLS.md setiap sesi baru          │    ║
║  └─────────────────────────────────────────────────────────┘    ║
╠══════════════════════════════════════════════════════════════════╣
║         LAPISAN 2: MCP TOOL LAYER (Jembatan ke Sub-Agent)        ║
║                                                                  ║
║  [perplexity-agent MCP]    [filesystem MCP]    [github MCP]     ║
║  • pplx_fast_search        • read_file         • create_branch  ║
║  • pplx_code_research      • write_file        • commit         ║
║  • pplx_code_agent         • list_directory    • push           ║
║  • pplx_parallel_agents    • exec_command      • diff           ║
║  • pplx_debug_loop         • search_files                       ║
╠══════════════════════════════════════════════════════════════════╣
║         LAPISAN 3: PERPLEXITY AGENT API (Spesialis)              ║
║                                                                  ║
║  fast-search          pro-search         deep-research          ║
║  Grok 4.1 (1 step)   GPT-5.1 (3 steps)  GPT-5.2 (10 steps)    ║
║  $0.0002/query        $0.003/query        $0.01/query            ║
║                                                                  ║
║  advanced-deep-research                                          ║
║  Claude Opus 4.6 (10 steps) — $0.05/query                       ║
║  Hanya dipanggil untuk arsitektur kompleks                       ║
╚══════════════════════════════════════════════════════════════════╝
```

***

## Implementasi Production-Ready: Struktur Project

```
super-orchestrator/
├── .brain/
│   ├── AGENTS.md          ← Project brain, dibaca Gemini di awal setiap sesi
│   ├── SKILLS.md          ← Reusable workflows (meniru Computer Skills)
│   └── memory/
│       ├── patterns.md    ← Pattern coding yang ditemukan
│       └── errors.md      ← Error yang pernah terjadi dan solusinya
├── mcp/
│   └── perplexity-agent/  ← Custom MCP server (Node.js)
│       ├── src/
│       │   ├── index.ts   ← Entry point MCP server
│       │   ├── agents.ts  ← Tool definitions
│       │   ├── loop.ts    ← Autonomous state machine
│       │   └── router.ts  ← Smart model routing logic
│       ├── dist/
│       ├── package.json
│       └── tsconfig.json
├── mcp_config.json        ← Konfigurasi MCP untuk Antigravity
└── .antigravity/
    └── settings.json      ← Global Skills (system prompt Gemini)
```

***

## File 1: `mcp_config.json` (Konfigurasi Antigravity)

Simpan di root workspace, atau di Settings → Manage MCP Servers → View Raw Config:[^12]

```json
{
  "mcpServers": {
    "perplexity-agent": {
      "command": "node",
      "args": ["./mcp/perplexity-agent/dist/index.js"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-GANTI_DENGAN_API_KEY_KAMU"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "/home/fahri/projects"],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_GANTI_DENGAN_TOKEN_KAMU"
      }
    }
  }
}
```

***

## File 2: `.brain/AGENTS.md` (Project Brain)

Ini meniru fitur **persistent memory** Perplexity Computer — file ini otomatis dibaca Gemini di awal setiap sesi:[^8]

```markdown
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
```

***

## File 3: `.brain/SKILLS.md` (Reusable Workflows)

Meniru fitur **Computer Skills** yang dirilis Maret 2026 — skill ini auto-aktif berdasarkan trigger phrase:[^13][^5]

```markdown
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
```

***

## File 4: `mcp/perplexity-agent/src/index.ts` (MCP Server Utama)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const PPLX_BASE = 'https://api.perplexity.ai';
const PPLX_KEY = process.env.PERPLEXITY_API_KEY!;

// Perplexity Agent API endpoint — juga bisa via /v1/responses (OpenAI-compatible)
const AGENT_ENDPOINT = `${PPLX_BASE}/v1/agent`;

// 4 preset resmi dari Agent API docs
type Preset = 'fast-search' | 'pro-search' | 'deep-research' | 'advanced-deep-research';

const PRESET_MODELS: Record<Preset, string> = {
  'fast-search':            'xai/grok-4-1-fast-non-reasoning',
  'pro-search':             'openai/gpt-5.1',
  'deep-research':          'openai/gpt-5.2',
  'advanced-deep-research': 'anthropic/claude-opus-4-6',
};

interface AgentCallParams {
  prompt: string;
  preset: Preset;
  responseFormat?: 'text' | 'json_object';
  extraTools?: any[];
}

async function callAgent(params: AgentCallParams): Promise<string> {
  const payload = {
    model: PRESET_MODELS[params.preset],
    preset: params.preset,
    input: params.prompt,
    stream: false,
    tools: [
      { type: 'web_search' },
      { type: 'fetch_url' },
      ...(params.extraTools ?? []),
    ],
    ...(params.responseFormat && {
      response_format: { type: params.responseFormat },
    }),
  };

  const res = await fetch(AGENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PPLX_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Perplexity Agent API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return (
    data.output_text ??
    data.output?.?.content ??
    JSON.stringify(data)
  );
}

// ─── SMART ROUTER ─────────────────────────────────────────────────────────────
// Menentukan preset optimal berdasarkan task type tanpa perlu Gemini specify manual
function smartRoute(taskHint: string): Preset {
  const hint = taskHint.toLowerCase();
  if (/quick|lookup|version|check|cek|versi/.test(hint)) return 'fast-search';
  if (/debug|fix|patch|error/.test(hint)) return 'pro-search';
  if (/implement|build|create|buat|generate/.test(hint)) return 'advanced-deep-research';
  return 'deep-research'; // default untuk research umum
}

// ─── MCP SERVER ───────────────────────────────────────────────────────────────
const server = new McpServer({ name: 'perplexity-agent', version: '3.0.0' });

// Tool 1: Fast lookup (Grok 4.1)
server.tool(
  'pplx_fast_search',
  'Quick web search. Untuk cek versi library, lookup cepat, konfirmasi info singkat. Hemat token.',
  { query: z.string() },
  async ({ query }) => {
    const text = await callAgent({ prompt: query, preset: 'fast-search' });
    return { content: [{ type: 'text', text }] };
  }
);

// Tool 2: Deep coding research (GPT-5.2, 10 steps)
server.tool(
  'pplx_code_research',
  'Research mendalam untuk coding. Dokumentasi, best practice, contoh implementasi. Gunakan untuk persiapan sebelum coding.',
  {
    query: z.string().describe('Topik coding yang ingin diteliti'),
    focus_areas: z.array(z.string()).optional(),
  },
  async ({ query, focus_areas }) => {
    const enriched = focus_areas?.length
      ? `${query}\n\nFokus pada:\n${focus_areas.map(a => `- ${a}`).join('\n')}`
      : query;
    const text = await callAgent({ prompt: enriched, preset: 'deep-research' });
    return { content: [{ type: 'text', text }] };
  }
);

// Tool 3: Full coding agent (Claude Opus 4.6) — senjata berat
server.tool(
  'pplx_code_agent',
  'Coding agent penuh dengan Claude Opus 4.6. Untuk generate kode kompleks, refactor besar, desain arsitektur. Hasilkan kode lengkap siap pakai.',
  {
    goal: z.string().describe('Goal coding yang ingin dicapai secara spesifik'),
    project_context: z.string().optional().describe('Konteks: stack, patterns, constraints'),
    language: z.string().default('typescript'),
    structured_output: z.boolean().default(false),
  },
  async ({ goal, project_context, language, structured_output }) => {
    const prompt = [
      project_context ? `## Project Context\n${project_context}` : '',
      `## Language\n${language}`,
      `## Goal\n${goal}`,
      `\nReturn kode yang lengkap dan siap dijalankan. Format: filename di comment pertama, lalu kode.`,
    ].filter(Boolean).join('\n\n');

    const text = await callAgent({
      prompt,
      preset: 'advanced-deep-research',
      responseFormat: structured_output ? 'json_object' : 'text',
    });
    return { content: [{ type: 'text', text }] };
  }
);

// Tool 4: Parallel sub-agents — meniru Computer multi-agent swarm
server.tool(
  'pplx_parallel_agents',
  'Jalankan beberapa Perplexity sub-agent secara PARALEL. Ini adalah tool terpowerful — gunakan untuk task yang bisa dipecah menjadi sub-task independen.',
  {
    tasks: z.array(z.object({
      id: z.string(),
      prompt: z.string(),
      preset: z.enum(['fast-search', 'pro-search', 'deep-research', 'advanced-deep-research'])
        .optional()
        .describe('Jika tidak diisi, auto-route berdasarkan prompt'),
    })).min(2).max(8),
  },
  async ({ tasks }) => {
    // Semua sub-agent berjalan paralel — ini inti dari multi-agent
    const results = await Promise.allSettled(
      tasks.map(async (task) => {
        const preset = task.preset ?? smartRoute(task.prompt);
        const output = await callAgent({ prompt: task.prompt, preset });
        return { id: task.id, preset, output };
      })
    );

    const formatted = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return `### ✅ [${r.value.id}] (${r.value.preset})\n${r.value.output}`;
      } else {
        return `### ❌ [${tasks[i].id}] ERROR\n${String(r.reason)}`;
      }
    }).join('\n\n---\n\n');

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    return {
      content: [{
        type: 'text',
        text: `## Parallel Agent Results (${succeeded}/${tasks.length} succeeded)\n\n${formatted}`,
      }],
    };
  }
);

// Tool 5: Debug loop (GPT-5.1 — cukup untuk analisis error)
server.tool(
  'pplx_debug_loop',
  'Analisis error + hasilkan patch yang langsung bisa diapply. Gunakan dalam fix loop setelah test gagal.',
  {
    error_log: z.string().describe('Error message / stack trace'),
    relevant_code: z.string().describe('Kode yang bermasalah'),
    language: z.string().default('typescript'),
    attempt_number: z.number().default(1).describe('Attempt ke berapa, untuk contextualize'),
  },
  async ({ error_log, relevant_code, language, attempt_number }) => {
    const prompt = `Debug ${language} code. Attempt #${attempt_number}.

## Error
\`\`\`
${error_log}
\`\`\`

## Code
\`\`\`${language}
${relevant_code}
\`\`\`

Return:
1. Root cause (1-2 kalimat)
2. Fixed code (LENGKAP, siap di-paste langsung)
3. Perubahan yang dibuat (singkat)`;

    const preset: Preset = attempt_number >= 3 ? 'advanced-deep-research' : 'pro-search';
    const text = await callAgent({ prompt, preset });
    return { content: [{ type: 'text', text }] };
  }
);

// Tool 6: Architecture advisor (untuk task paling kompleks)
server.tool(
  'pplx_architecture',
  'Desain atau review arsitektur sistem. Gunakan untuk keputusan high-level: pilih teknologi, desain database schema, system design.',
  {
    question: z.string(),
    constraints: z.array(z.string()).optional(),
    existing_stack: z.string().optional(),
  },
  async ({ question, constraints, existing_stack }) => {
    const tasks = [
      {
        id: 'patterns',
        prompt: `Architecture patterns for: ${question}`,
        preset: 'deep-research' as Preset,
      },
      {
        id: 'tradeoffs',
        prompt: `Trade-offs and considerations for: ${question}. Constraints: ${constraints?.join(', ')}`,
        preset: 'deep-research' as Preset,
      },
      {
        id: 'implementation',
        prompt: `Concrete implementation guide for: ${question}. Stack: ${existing_stack ?? 'Node.js TypeScript'}`,
        preset: 'advanced-deep-research' as Preset,
      },
    ];

    const results = await Promise.allSettled(
      tasks.map(t => callAgent({ prompt: t.prompt, preset: t.preset }).then(r => ({ id: t.id, output: r })))
    );

    const combined = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value)
      .map((r: any) => `### ${r.id}\n${r.output}`)
      .join('\n\n---\n\n');

    return { content: [{ type: 'text', text: combined }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

***

## File 5: Global Skills — System Prompt Gemini di Antigravity

Di Antigravity: **Agent Manager → Settings → Global Skills**, paste ini:

```markdown
# Identitas & Misi
Kamu adalah Super-Orchestrator coding assistant yang LEBIH POWERFUL dari Perplexity Computer.
Kamu menggunakan Gemini 3.1 Pro Customtools sebagai otak utama, dan mengorkestrasikan
Perplexity Agent API (Claude Opus 4.6, GPT-5.2, Grok 4.1) sebagai sub-agent spesialis.

# Protokol Wajib di Awal Setiap Sesi
1. Baca `.brain/AGENTS.md` untuk konteks proyek saat ini
2. Baca `.brain/SKILLS.md` untuk mengetahui workflow yang tersedia
3. Tentukan mode: Planning (task kompleks) atau Fast (task kecil)

# Cara Menggunakan MCP Tools

## MCP Perplexity Agent (`@mcp:perplexity-agent`)
- `pplx_fast_search` → Quick lookup, cek versi, info singkat
- `pplx_code_research` → Research mendalam sebelum coding
- `pplx_code_agent` → Generate/refactor kode kompleks (Claude Opus 4.6)
- `pplx_parallel_agents` → Multiple sub-task secara PARALEL — SELALU gunakan ini untuk task yang bisa dipecah
- `pplx_debug_loop` → Analisis error + patch
- `pplx_architecture` → System design dan arsitektur

## MCP Filesystem (`@mcp:filesystem`)
- `read_file` → Baca kode existing sebelum modifikasi
- `write_file` → Tulis hasil langsung ke workspace
- `list_directory` → Scan struktur project
- `exec_command` → Jalankan test, build, CLI tools

# Aturan Parallel Execution
SELALU panggil tools secara paralel bila tidak ada dependency.
Contoh: research A + research B + baca file = 3 panggilan paralel, bukan sekuensial.
Ini yang membuat sistem ini setara dengan Computer dalam hal efisiensi.

# Autonomous Loop untuk Coding
Untuk setiap task coding:
plan → research (paralel) → code → test → [jika gagal: debug → fix → test ulang]
Jalankan loop ini TANPA meminta izin kecuali untuk operasi di Approval Gate.

# Approval Gate — Tanya User Dulu
- `rm -rf` atau hapus folder
- `git push` ke remote
- Modifikasi `.env` atau secret file

# Update Memory Setelah Task
Setelah setiap task selesai, append ke `.brain/AGENTS.md`:
- Pattern baru yang ditemukan
- Error yang terjadi dan solusinya
- Keputusan arsitektur yang dibuat
```

***

## Alur Lengkap: Dari Prompt ke Hasil

### Skenario: "Buat sistem rotating proxy dengan health check otomatis"

```
Kamu → Antigravity Agent Manager
         │
         ▼ Gemini 3.1 Pro membaca AGENTS.md + SKILLS.md
         │ → Pilih skill: "new-feature"
         │ → Pilih mode: Planning (task kompleks)
         │
         ▼ TURN 1 — Gemini generate PARALLEL calls:
         ├─ pplx_parallel_agents([
         │    { id: "proxy-patterns", prompt: "rotating proxy pool patterns Node.js 2026", preset: "deep-research" },
         │    { id: "health-check",   prompt: "HTTP health check best practice async Node.js", preset: "deep-research" },
         │    { id: "deps",           prompt: "latest got vs axios vs undici performance 2026", preset: "fast-search" }
         │  ])
         └─ filesystem:read_file("src/proxy-pool.ts")  ← baca kode existing

         ▼ Semua 4 calls berjalan PARALEL (~15 detik total, bukan ~60 detik sekuensial)

         ▼ Gemini synthesize → buat Implementation Plan Artifact
         │ [masuk ke Inbox Antigravity — kamu review sekali]
         │
         ▼ Kamu approve di Inbox
         │
         ▼ TURN 2:
         └─ pplx_code_agent(
              goal="Implement rotating proxy pool dengan health check otomatis",
              project_context="<dari AGENTS.md + research>",
              language="typescript"
            )  ← Claude Opus 4.6 yang mengeksekusi ini

         ▼ Claude Opus return kode lengkap

         ▼ TURN 3 — Gemini tulis file + test:
         ├─ filesystem:write_file("src/proxy-pool.ts", <kode>)
         ├─ filesystem:write_file("src/proxy-pool.test.ts", <test>)
         └─ exec_command("pnpm test proxy-pool")

         ▼ Jika test GAGAL:
         └─ pplx_debug_loop(error_log, code, attempt=1)
             → apply fix → exec_command test ulang
             → jika gagal lagi → attempt=2 dst. (max 5x)
             → di attempt 3+: otomatis naik ke advanced-deep-research

         ▼ Test PASSED ✅
         └─ filesystem:write_file(".brain/AGENTS.md", append pattern baru)

         ▼ Selesai. Total interaksi manual kamu: 1x (approve di Inbox)
```

***

## Perbandingan Akhir: Sistem Ini vs Perplexity Computer

| Dimensi | Perplexity Computer | Sistem Ini |
|---|---|---|
| **Biaya orchestrator** | Termasuk di $200/bln[^11] | **Gratis** (Gemini AI Pro)[^10] |
| **Biaya sub-agent** | Kredit habis cepat (40% dalam 1 jam)[^2] | Pay-per-use terkontrol, ~$0.002 rata-rata per query |
| **Spending cap** | Default $200/bln, max $2.000[^14] | Kamu yang kontrol penuh di API dashboard |
| **Model sub-agent** | 19 model, routing otomatis[^1] | 4 preset (Grok/GPT-5.1/GPT-5.2/Claude Opus 4.6) |
| **Persistent memory** | Ya, cloud[^8] | Ya, **lokal** via AGENTS.md |
| **Skills** | Ya, Computer Skills[^6] | Ya, SKILLS.md + auto-aktivasi |
| **Parallel agents** | Ya, cloud sandbox[^7] | Ya, `Promise.allSettled()` lokal |
| **Filesystem access** | Cloud sandbox terisolasi[^4] | **Langsung ke filesystem lokal** |
| **Approval gate** | Check-in jika stuck[^1] | Antigravity Inbox, hanya untuk operasi berisiko[^9] |
| **Custom connectors** | 15+ built-in (Slack, Jira, dll)[^15] | MCP tak terbatas — tambah apa saja |
| **Watermark output** | Ada: "Created with Perplexity Computer"[^11] | **Tidak ada** |
| **Platform dependency** | Hanya web desktop[^11] | Antigravity + Gemini CLI sebagai fallback[^16] |
| **Paritas fungsional** | 100% (referensi) | **~95%** untuk coding workflow |

***

## Quick Start: 5 Langkah Mulai Besok

1. **Clone template** — buat folder `super-orchestrator/` dengan struktur di atas
2. **Build MCP server** — `cd mcp/perplexity-agent && pnpm install && pnpm build`
3. **Edit `mcp_config.json`** — isi API key Perplexity dan path yang benar
4. **Import config di Antigravity** — Settings → Manage MCP Servers → paste JSON
5. **Buka Agent Manager** (CMD+Shift+A) — buat workspace baru, paste Global Skills, mulai coding

Untuk verifikasi MCP terkoneksi: ketik di chat Antigravity:
```
Daftar semua MCP tools yang tersedia
```
Seharusnya muncul: `pplx_fast_search`, `pplx_code_research`, `pplx_code_agent`, `pplx_parallel_agents`, `pplx_debug_loop`, `pplx_architecture`.

***

## Estimasi Biaya vs Perplexity Computer Max

Asumsi penggunaan berat: 50 task coding/bulan, mix berbagai kompleksitas:

| Komponen | PC Max (Computer) | Sistem Ini |
|---|---|---|
| Subscription | $200/bln wajib[^11] | $0 (Gemini AI Pro sudah ada) |
| Orchestrator API | Termasuk di kredit | $0 (Gemini gratis) |
| Sub-agent (fast) | Habis dari kredit | ~$0.01 (50 queries × $0.0002) |
| Sub-agent (research) | Habis dari kredit | ~$0.50 (50 queries × $0.01) |
| Sub-agent (coding) | Habis dari kredit | ~$2.50 (50 queries × $0.05) |
| **Total/bulan** | **$200+ (bisa +$200 kredit tambahan)** | **~$3–5** |

Penghematan: **97-98%** dibanding Perplexity Computer Max, dengan kapabilitas yang setara atau lebih baik untuk coding workflow.

---

## References

1. [Introducing Perplexity Computer](https://www.perplexity.ai/hub/blog/introducing-perplexity-computer) - The coordination is automatic, and the work is asynchronous. You can focus on other things, or run d...

2. [Ep 726: Perplexity Computer: What it is, How to use ...](https://www.youreverydayai.com/ep-726-perplexity-computer-what-it-is-how-to-use-it-and-is-it-better-than-openclaw/) - Perplexity Computer operates in a secure, cloud-based sandbox. Unlike OpenClaw—which is self-hosted ...

3. [Perplexity Computer Review: What It Gets Right (and Wrong)](https://www.builder.io/blog/perplexity-computer) - It's a cloud-based AI agent that orchestrates 19 models simultaneously, routing each subtask to whic...

4. [Explained: What is Perplexity Computer and how does it work](https://timesofindia.indiatimes.com/technology/tech-news/explained-what-is-perplexity-computer-and-how-does-it-work/articleshow/128881052.cms) - Every task runs inside an isolated sandbox environment with access to a real filesystem, browser, an...

5. [Perplexity Changelog](https://www.perplexity.ai/changelog/what-we-shipped---march-6-2026) - Teach Perplexity Computer how to handle any task once, and it remembers forever. Skills are reusable...

6. [How to use Computer Skills | Perplexity Help Center](https://www.perplexity.ai/help-center/en/articles/13914413-how-to-use-computer-skills) - Skills are reusable instruction sets that teach Perplexity Computer how to perform specific tasks. ....

7. [Introducing Perplexity Computer: Unified AI System](https://www.linkedin.com/posts/perplexity-ai_introducing-perplexity-computer-computer-activity-7432461311281893376-SvTW) - Perplexity just introduced “Perplexity Computer,” a system that routes work across 19 different mode...

8. [Perplexity Computer Complete Guide: 19 Models, 15 ...](https://www.the-ai-corner.com/p/perplexity-computer-complete-guide) - Deep research with automatic source synthesis. Code projects from spec to deployment. Content pipeli...

9. [Google Antigravity Agent Manager Explained: Deep Dive - Arjan KC](https://www.arjankc.com.np/blog/google-antigravity-agent-manager-explained/) - Explore Google Antigravity's Agent Manager, the core of its AI-first IDE. Understand its autonomous ...

10. [Gemini 3.1 Pro, Building with Advanced Intelligence in ...](https://antigravity.google/blog/gemini-3-1-pro-in-google-antigravity) - Today, we're taking a step forward by bringing Gemini 3.1 Pro directly into your Antigravity workflo...

11. [Perplexity Computer: A complete guide to the AI agent system in 2026](https://www.eesel.ai/blog/perplexity-computer) - 4,9

12. [Antigravity Editor: MCP Integration](https://antigravity.google/docs/mcp) - Click on "Manage MCP Servers"; Click on "View raw config"; Modify the mcp_config.json with your cust...

13. [NEW Perplexity Computer Update is INSANE! (GPT 5.4 + Gemini 3.1 ...](https://www.linkedin.com/posts/juliangoldieseo_new-perplexity-computer-update-is-insane-activity-7437284445713432576-8Ko5) - These are reusable capabilities, step by step instructions, preferred formats, specific workflows. Y...

14. [How Credits Work on Perplexity | Perplexity Help Center](https://www.perplexity.ai/help-center/en/articles/13838041-how-credits-work-on-perplexity) - Credits are available to Perplexity Max and Enterprise Max subscribers. Max users receive 10,000 cre...

15. [Connectors & Integrations | Perplexity Help Center](https://www.perplexity.ai/help-center/en/collections/18799295-connectors-integrations) - Connecting Perplexity with Google DriveIntegrate your Google Drive files with Perplexity, enabling i...

16. [Deploy Applications from Gemini CLI and Antigravity to ...](https://codelabs.developers.google.com/deploy-to-cloud-run-using-oss-mcp-server) - We will dive deep into how you can deploy your application from Gemini CLI and Anitgravity to Cloud ...

