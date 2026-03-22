import * as fs from "fs";
import { logger } from "../logger.js";

export interface AgentsMdSection {
  heading: string;
  headingLevel: number;
  rawHeadingLine: string;
  content: string;
  startLine: number;
  endLine: number;
}

export class InstructionOptimizer {
  /**
   * Parses AGENTS.md into predictable sections based on Markdown headings.
   */
  public parseSections(markdown: string): AgentsMdSection[] {
    const sections: AgentsMdSection[] = [];
    const lines = markdown.split("\n");
    let currentSection: Partial<AgentsMdSection> | null = null;
    let contentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const headingMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentSection) {
          currentSection.content = contentLines.join("\n").trim();
          currentSection.endLine = i - 1;
          sections.push(currentSection as AgentsMdSection);
        }
        currentSection = {
          heading: headingMatch[2].trim(),
          headingLevel: headingMatch[1].length,
          rawHeadingLine: lines[i],
          startLine: i,
        };
        contentLines = [];
      } else {
        contentLines.push(lines[i]);
      }
    }

    if (currentSection) {
      currentSection.content = contentLines.join("\n").trim();
      currentSection.endLine = lines.length - 1;
      sections.push(currentSection as AgentsMdSection);
    }

    return sections;
  }

  /**
   * Reconstructs the full Markdown document from sections.
   */
  public reconstruct(sections: AgentsMdSection[]): string {
    return sections
      .map((s) => `${s.rawHeadingLine}\n${s.content}`)
      .join("\n\n");
  }

  /**
   * Validates structural integrity (e.g., heading levels don't regress).
   */
  public validate(original: string, modified: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const origSections = this.parseSections(original);
    const modSections = this.parseSections(modified);

    if (origSections.length !== modSections.length) {
      errors.push(`Section count mismatch: ${origSections.length} vs ${modSections.length}`);
    }

    // Check if headings are preserved
    for (let i = 0; i < Math.min(origSections.length, modSections.length); i++) {
      if (origSections[i].heading !== modSections[i].heading) {
        errors.push(`Heading mismatch at index ${i}: "${origSections[i].heading}" vs "${modSections[i].heading}"`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export const optimizer = new InstructionOptimizer();
