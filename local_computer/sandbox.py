import os
import subprocess
import textwrap
from pathlib import Path

from local_computer.settings import settings


def _workspace_abs() -> Path:
    root = settings.workspace
    if not root.is_absolute():
        root = Path.cwd() / root
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


def run_command(command: str) -> dict:
    """Run shell command inside Docker with workspace mounted at /workspace."""
    ws = _workspace_abs()
    net = settings.sandbox_network
    cmd = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{ws}:/workspace",
        "-w",
        "/workspace",
        "--network",
        net,
        settings.sandbox_image,
        "bash",
        "-lc",
        command,
    ]
    env = os.environ.copy()
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=settings.command_timeout_sec,
            env=env,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if len(out) > 120_000:
            out = out[:120_000] + "\n...[truncated]"
        return {
            "ok": proc.returncode == 0,
            "exit_code": proc.returncode,
            "output": out,
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "exit_code": -1, "output": "Command timed out."}
    except FileNotFoundError:
        return {
            "ok": False,
            "exit_code": -1,
            "output": "docker not found. Install docker.io and ensure it is in PATH.",
        }


def _safe_rel(path: str) -> Path:
    raw = (path or ".").strip().replace("\\", "/")
    p = raw.lstrip("/") or "."
    parts = Path(p).parts
    if ".." in parts:
        raise ValueError("path must stay inside workspace")
    return Path(p)


def read_file(path: str) -> dict:
    ws = _workspace_abs()
    rel = _safe_rel(path)
    full = (ws / rel).resolve()
    if ws not in full.parents and full != ws:
        raise ValueError("path outside workspace")
    if not full.exists() or not full.is_file():
        return {"ok": False, "output": "File not found."}
    try:
        content = full.read_text(encoding="utf-8", errors="replace")
        if len(content) > 200_000:
            content = content[:200_000] + "\n...[truncated]"
        return {"ok": True, "output": content}
    except OSError as e:
        return {"ok": False, "output": str(e)}


def write_file(path: str, content: str) -> dict:
    ws = _workspace_abs()
    rel = _safe_rel(path)
    full = (ws / rel).resolve()
    if ws not in full.parents and full != ws:
        raise ValueError("path outside workspace")
    full.parent.mkdir(parents=True, exist_ok=True)
    try:
        full.write_text(content, encoding="utf-8")
        return {"ok": True, "output": f"Wrote {len(content)} bytes."}
    except OSError as e:
        return {"ok": False, "output": str(e)}


def list_dir(path: str = ".") -> dict:
    ws = _workspace_abs()
    rel = _safe_rel(path) if path.strip() else Path(".")
    full = (ws / rel).resolve()
    if ws not in full.parents and full != ws:
        raise ValueError("path outside workspace")
    if not full.exists() or not full.is_dir():
        return {"ok": False, "output": "Not a directory."}
    lines = []
    try:
        for child in sorted(full.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
            kind = "dir" if child.is_dir() else "file"
            lines.append(f"{kind}\t{child.name}")
        return {"ok": True, "output": "\n".join(lines) if lines else "(empty)"}
    except OSError as e:
        return {"ok": False, "output": str(e)}


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Run a shell command in an isolated Debian container; cwd is /workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Shell command (bash -lc).",
                    }
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a UTF-8 text file under the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Relative path under workspace."}
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Create or overwrite a UTF-8 text file under the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_dir",
            "description": "List files and subdirectories.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative directory; default '.'",
                    }
                },
            },
        },
    },
]


def dispatch_tool(name: str, arguments: dict) -> str:
    if name == "run_command":
        r = run_command(arguments.get("command", ""))
    elif name == "read_file":
        r = read_file(arguments.get("path", ""))
    elif name == "write_file":
        r = write_file(arguments.get("path", ""), arguments.get("content", ""))
    elif name == "list_dir":
        r = list_dir(arguments.get("path") or ".")
    else:
        return f"Unknown tool: {name}"
    status = "ok" if r.get("ok") else "error"
    return textwrap.dedent(
        f"""\
        [{status}] exit_code={r.get("exit_code", "n/a")}
        {r.get("output", "")}
        """
    ).strip()
