import asyncio
import json
from typing import Any

from local_computer.llm import get_openai_client
from local_computer.sandbox import TOOL_DEFINITIONS, dispatch_tool
from local_computer.settings import settings

SYSTEM = """You are a Linux agent with a sandboxed environment (Debian 12 in Docker).
Working directory on the host is mounted at /workspace in the container.
Use tools to run commands, read/write files, and list directories. Stay under the workspace.
If you need up-to-date information from the internet, rely on Perplexity web search (Sonar) and include citations.
Prefer concise shell commands; combine steps when safe. Briefly state intent before heavy commands."""


def _parse_tool_args(raw: str) -> dict[str, Any]:
    try:
        return json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        return {}


def _sonar_extra_body() -> dict[str, Any]:
    # Sonar API parameters that control how web search is used.
    # We keep this conservative and let the model decide when to search.
    return {
        "search_mode": "web",
        "enable_search_classifier": True,
        "search_recency_filter": "month",
    }


async def run_agent_turn(user_message: str, max_rounds: int = 32) -> dict[str, Any]:
    client, model = get_openai_client()
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user_message},
    ]
    trace: list[dict[str, Any]] = []
    citations: list[str] = []
    search_results: list[dict[str, Any]] = []

    def _call():
        extra_body = _sonar_extra_body() if settings.llm_provider.lower().strip() == "perplexity" else None
        return client.chat.completions.create(
            model=model,
            messages=messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.2,
            extra_body=extra_body,
        )

    for _ in range(max_rounds):
        completion = await asyncio.to_thread(_call)
        choice = completion.choices[0]
        msg = choice.message
        assistant_payload: dict[str, Any] = {
            "role": "assistant",
            "content": msg.content if msg.content else None,
        }
        if msg.tool_calls:
            assistant_payload["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in msg.tool_calls
            ]
        messages.append(assistant_payload)

        if not msg.tool_calls:
            citations = getattr(completion, "citations", None) or []
            search_results = getattr(completion, "search_results", None) or []
            return {
                "reply": msg.content or "",
                "trace": trace,
                "model": model,
                "citations": citations,
                "search_results": search_results,
            }

        for tc in msg.tool_calls:
            name = tc.function.name
            args = _parse_tool_args(tc.function.arguments or "")
            result = dispatch_tool(name, args)
            trace.append({"tool": name, "arguments": args, "result": result})
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                }
            )

    return {
        "reply": "Stopped: too many tool rounds (safety limit).",
        "trace": trace,
        "model": model,
        "citations": citations,
        "search_results": search_results,
    }
