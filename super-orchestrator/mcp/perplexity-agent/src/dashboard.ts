import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import path from "path";
import fs from "fs";
import { intelligence } from "./intelligence.js";
import { logger } from "./logger.js";

const fastify = Fastify({ logger: false });

export async function startDashboard(port = 3001) {
  await fastify.register(fastifyCors, { origin: true });

  // Serve the dashboard frontend
  const dashboardPath = path.join(process.cwd(), "dashboard");
  if (!fs.existsSync(dashboardPath)) {
    fs.mkdirSync(dashboardPath, { recursive: true });
  }

  await fastify.register(fastifyStatic, {
    root: dashboardPath,
    prefix: "/",
  });

  // API: Status & Telemetry
  fastify.get("/api/stats", async () => {
    const usagePath = path.join(process.cwd(), ".brain", "telemetry", "usage.md");
    let usageContent = "";
    if (fs.existsSync(usagePath)) {
      usageContent = fs.readFileSync(usagePath, "utf-8");
    }

    // Basic parsing of usage.md for total cost (Last 50 lines)
    const lines = usageContent.split("\n").filter(l => l.includes("|")).slice(-50);
    let totalCost = 0;
    let totalSaved = 0;
    lines.forEach(line => {
      const parts = line.split("|").map(p => p.trim());
      if (parts.length > 5) {
        const cost = parseFloat(parts[5]);
        const cache = parts[4];
        if (!isNaN(cost)) totalCost += cost;
        if (cache.includes("🔄")) {
          const saved = parseInt(cache.replace("🔄", "")) * 0.00001;
          totalSaved += saved;
        }
      }
    });

    return {
      totalCost: totalCost.toFixed(4),
      totalSaved: totalSaved.toFixed(4),
      lastUpdate: new Date().toISOString()
    };
  });

  // API: Intelligence (Lessons Learned)
  fastify.get("/api/intelligence", async () => {
    try {
      const lessons = await intelligence.getStats();
      return { lessons };
    } catch (err) {
      return { lessons: { total: 0, byCategory: {} } };
    }
  });

  try {
    await fastify.listen({ port, host: "0.0.0.0" });
    logger.info(`Superintendent Dashboard running at http://localhost:${port}`);
  } catch (err) {
    logger.error("Failed to start dashboard", { error: String(err) });
  }
}
