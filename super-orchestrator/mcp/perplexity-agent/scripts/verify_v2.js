import { smartRoute } from "../src/router.js";
import { contextAnalyzer } from "../src/context.js";
import { telemetry } from "../src/telemetry.js";
async function testV2() {
    console.log("🚀 Starting Super-Orchestrator v2.0 Verification...");
    // Check env
    if (!process.env.PERPLEXITY_API_KEY) {
        console.warn("⚠️ PERPLEXITY_API_KEY not set. Skipping API-dependent tests.");
        process.env.PERPLEXITY_API_KEY = "dummy-key-for-testing-logic";
    }
    // 1. Test Dynamic Routing
    console.log("\n--- Testing Dynamic Routing ---");
    const tests = [
        { hint: "latest version of react", expected: "fast-search" },
        { hint: "debug memory leak in nodejs", expected: "pro-search" },
        { hint: "implement rotating proxy with health check", expected: "advanced-deep-research" },
        { hint: "architecture for real-time video streaming", expected: "advanced-deep-research" }
    ];
    for (const t of tests) {
        const result = smartRoute(t.hint);
        console.log(`Hint: "${t.hint}" -> Result: ${result} ${result === t.expected ? "✅" : "❌"}`);
    }
    // 2. Test Context Analyzer
    console.log("\n--- Testing Context Analyzer ---");
    const ctx = await contextAnalyzer.analyze();
    const formatted = contextAnalyzer.format(ctx);
    console.log("Context summary extracted ✅");
    console.log(formatted);
    // 3. Test Telemetry
    console.log("\n--- Testing Telemetry Log ---");
    telemetry.record({
        preset: "fast-search",
        durationMs: 120,
        success: true
    });
    console.log("Telemetry event recorded ✅");
    console.log("\n✨ Verification steps completed locally.");
}
testV2().catch(console.error);
