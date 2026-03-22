import { config } from "../config.js";
import { postJson } from "../http.js"; // Reuse existing http helper
import { logger } from "../logger.js";

export interface YouSearchResult {
  title: string;
  url: string;
  snippets: string[];
}

export interface YouScoutOptions {
  useResearch?: boolean;
  researchLevel?: "lite" | "standard" | "deep" | "exhaustive";
}

export class YouScout {
  private static SEARCH_URL = "https://api.ydc-index.io/search";
  private static RESEARCH_URL = "https://api.ydc-index.io/research";

  public async search(query: string): Promise<YouSearchResult[]> {
    if (!config.YOU_API_KEY) {
      logger.warn("YOU_API_KEY missing. Scouting skipped.");
      return [];
    }

    try {
      const data: any = await postJson(
        YouScout.SEARCH_URL,
        { query },
        { "X-API-Key": config.YOU_API_KEY }
      );
      
      return data.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippets: r.snippets || []
      })) || [];
    } catch (err) {
      logger.error("You.com Search failed", { error: String(err) });
      return [];
    }
  }

  public async research(query: string, level: YouScoutOptions["researchLevel"] = "lite"): Promise<string> {
    if (!config.YOU_API_KEY) return "You.com API Key missing.";

    try {
      const data: any = await postJson(
        YouScout.RESEARCH_URL,
        { query, level },
        { "X-API-Key": config.YOU_API_KEY }
      );
      return data.answer || "No synthesis returned.";
    } catch (err) {
      logger.error("You.com Research failed", { error: String(err) });
      return `Error: ${String(err)}`;
    }
  }

  /**
   * Orchestrates a "Master Scout" pass.
   * Finds the best snippets and synthesizes a preliminary context.
   */
  public async masterScout(query: string): Promise<string> {
    logger.info("Starting Master Scout pass via You.com", { query: query.slice(0, 30) });
    
    // First, try Lite Research for context
    const synthesis = await this.research(query, "lite");
    
    // Then, grab specific search snippets for raw data
    const rawResults = await this.search(query);
    const topUrls = rawResults.slice(0, 3).map(r => `- [${r.title}](${r.url})`).join("\n");

    return [
      "## Preliminary Scouting Report (from You.com)",
      synthesis,
      "\n### Top References discovered:",
      topUrls
    ].join("\n");
  }
}

export const scout = new YouScout();
