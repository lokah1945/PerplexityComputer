# Local Computer (Perplexity-style agent on Linux)

Lingkungan **agen + sandbox terminal + workspace file** yang dijalankan di mesin Anda (mis. Debian 12), konsepnya mirip “Computer”: model memutuskan perintah, membaca/menulis file, dan menjalankan shell di kontainer terisolasi.

## Batasan penting (bukan rahasia, kebijakan produk)

| Yang Anda punya | Yang bisa dilakukan secara resmi |
|-----------------|-----------------------------------|
| **Perplexity Max** (web/app) | Pakai produk di browser/aplikasi resmi. **Tidak** termasuk akses API untuk skrip/server. |
| **Perplexity API** | Akses terprogram (kunci API + penagihan terpisah dari Max). |

Jadi **clone 1:1 sisi “otak” Perplexity** (model + grounding sama persis) **tanpa kunci API** **tidak didukung** oleh jalur resmi. Repo ini memberikan **kemampuan setara di sisi Linux** (sandbox + tools); untuk menyambungkan **model Perplexity** Anda perlu **kunci API** (biaya terpisah).

## Fitur

- Chat web (HTTP + SSE) dengan loop **tool**: `run_command`, `read_file`, `write_file`, `list_dir`
- Eksekusi perintah di **Docker** (`debian:12-slim` default), workspace ter-mount read-write
- Mode LLM: **Perplexity API** (opsional) atau **Ollama** (lokal, tanpa API Perplexity)

## Prasyarat (Debian 12)

```bash
sudo apt update
sudo apt install -y python3 python3-venv docker.io
sudo usermod -aG docker "$USER"
# logout/login agar grup docker aktif
```

## Instalasi

```bash
cd PerplexityComputer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — setidaknya pilih LLM_PROVIDER dan variabel terkait
```

## Menjalankan

```bash
source .venv/bin/activate
uvicorn local_computer.main:app --host 0.0.0.0 --port 8765
```

Buka `http://localhost:8765`.

## Konfigurasi LLM

**Ollama (lokal, tanpa Perplexity)**

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

**Perplexity API** (perlu kunci dari portal API, **bukan** “hanya Max”):

```env
LLM_PROVIDER=perplexity
PERPLEXITY_API_KEY=pplx-...
PERPLEXITY_MODEL=sonar
```

## Keamanan

Ini menjalankan perintah shell **di dalam Docker** sesuai input model. Hanya jalankan di mesin yang Anda percaya; batasi jaringan dengan `SANDBOX_NETWORK` jika perlu.

## Lisensi

MIT — gunakan dengan risiko Anda sendiri.
