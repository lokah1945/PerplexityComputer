import { db } from "./db.js";
import { logger } from "./logger.js";
import { type Preset } from "./router.js";

export interface Lesson {
  taskDescription: string;
  preset: Preset;
  strategy: string;
  result: string;
  successScore: number;
  critique?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface GoldenTrace {
  taskDescription: string;
  preset: Preset;
  systemPromptVersion: string;
  trace: any[];
  outcome: "PASS" | "FAIL";
  metrics: {
    duration: number;
    tokens: number;
    steps: number;
  };
  timestamp: Date;
}

export class IntelligenceEngine {
  private lessonsCol = "lessons";
  private goldenCol = "golden_sets";

  public async saveLesson(lesson: Omit<Lesson, "timestamp">) {
    try {
      const col = await db.getCollection(this.lessonsCol);
      const entry = { ...lesson, timestamp: new Date() };
      await col.insertOne(entry);
      logger.info("New lesson saved to intelligence hub", { task: lesson.taskDescription.slice(0, 30) });
    } catch (err) {
      logger.error("Failed to save lesson", { error: String(err) });
    }
  }

  public async saveGoldenTrace(trace: Omit<GoldenTrace, "timestamp">) {
    try {
      const col = await db.getCollection(this.goldenCol);
      await col.insertOne({ ...trace, timestamp: new Date() });
      logger.info("New Golden Trace archived for benchmarking", { task: trace.taskDescription.slice(0, 30) });
    } catch (err) {
      logger.error("Failed to save golden trace", { error: String(err) });
    }
  }

  public async getGoldenSamples(limit = 10): Promise<GoldenTrace[]> {
    try {
      const col = await db.getCollection(this.goldenCol);
      return await col.find({ outcome: "PASS" }).sort({ timestamp: -1 }).limit(limit).toArray() as unknown as GoldenTrace[];
    } catch (err) {
      return [];
    }
  }

  public async scoutSimilar(prompt: string): Promise<Lesson[]> {
    try {
      const col = await db.getCollection(this.lessonsCol);
      // Basic text search.
      const searchTerms = prompt.split(" ").filter(w => w.length > 3).slice(0, 5);
      const regex = new RegExp(searchTerms.join("|"), "i");
      
      const results = await col.find({ 
        taskDescription: { $regex: regex },
        successScore: { $gte: 4 } // Only learn from high-quality past work
      }).limit(3).toArray();

      return results as unknown as Lesson[];
    } catch (err) {
      logger.error("Scouting failed", { error: String(err) });
      return [];
    }
  }

  public formatMemory(lessons: Lesson[]): string {
    if (lessons.length === 0) return "";
    
    const lines = ["## Lessons Learned from Similar Past Tasks"];
    lessons.forEach((l, i) => {
      lines.push(`### Past Success #${i + 1}: ${l.taskDescription.slice(0, 50)}...`);
      lines.push(`- Strategy used: ${l.strategy}`);
      lines.push(`- Result: Successfully solved with score ${l.successScore}/5`);
      if (l.critique) lines.push(`- Self-Critique: ${l.critique}`);
    });
    return lines.join("\n");
  }
}

export const intelligence = new IntelligenceEngine();
