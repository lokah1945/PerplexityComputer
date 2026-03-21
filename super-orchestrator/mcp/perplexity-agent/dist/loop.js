export function nextState(current, ctx) {
    if (current === "plan")
        return "research";
    if (current === "research")
        return "code";
    if (current === "code")
        return "test";
    if (current === "test")
        return ctx.lastError ? "fix" : "done";
    if (current === "fix")
        return ctx.attempts >= 5 ? "done" : "test";
    return "done";
}
export function loopHint(state) {
    switch (state) {
        case "plan":
            return "Buat implementation plan singkat sebelum eksekusi.";
        case "research":
            return "Jalankan riset paralel untuk memperkaya konteks.";
        case "code":
            return "Implementasikan solusi berbasis hasil riset.";
        case "test":
            return "Verifikasi hasil dengan test/build command.";
        case "fix":
            return "Debug error lalu patch, ulangi hingga lolos atau max attempts.";
        default:
            return "Workflow selesai.";
    }
}
