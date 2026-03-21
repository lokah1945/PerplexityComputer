const log = document.getElementById("log");
const form = document.getElementById("form");
const input = document.getElementById("input");
const send = document.getElementById("send");

function appendBubble(role, text) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function appendMeta(text) {
  const div = document.createElement("div");
  div.className = "bubble meta";
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function appendTrace(trace) {
  if (!trace || !trace.length) return;
  for (const row of trace) {
    const det = document.createElement("details");
    det.className = "tool";
    det.open = false;
    const summary = document.createElement("summary");
    summary.textContent = `Tool: ${row.tool}`;
    const pre = document.createElement("pre");
    pre.textContent =
      (typeof row.arguments === "object"
        ? JSON.stringify(row.arguments, null, 2)
        : String(row.arguments)) +
      "\n---\n" +
      String(row.result ?? "");
    det.appendChild(summary);
    det.appendChild(pre);
    log.appendChild(det);
  }
  log.scrollTop = log.scrollHeight;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  send.disabled = true;
  appendBubble("user", message);
  input.value = "";
  appendMeta("… memproses");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const meta = log.querySelector(".bubble.meta:last-of-type");
    if (meta) meta.remove();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const d = err.detail;
      const detail =
        Array.isArray(d)
          ? d.map((x) => x.msg || JSON.stringify(x)).join("; ")
          : d || res.statusText || "Error";
      appendBubble("assistant", detail);
      return;
    }
    const data = await res.json();
    appendTrace(data.trace);
    appendBubble("assistant", data.reply || "(kosong)");
    if (data.model) appendMeta(`Model: ${data.model}`);
    if (Array.isArray(data.citations) && data.citations.length) {
      const first = data.citations.slice(0, 6).join(", ");
      appendMeta(`Citations: ${first}${data.citations.length > 6 ? " ..." : ""}`);
    }
  } catch (err) {
    const meta = log.querySelector(".bubble.meta:last-of-type");
    if (meta) meta.remove();
    appendBubble("assistant", String(err));
  } finally {
    send.disabled = false;
  }
});
