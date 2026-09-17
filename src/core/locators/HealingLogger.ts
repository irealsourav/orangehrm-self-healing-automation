import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export interface HealingLogEntry {
  timestamp: string;
  pageKey: string;
  descriptorId: string;
  description: string;
  healedIndex: number;
  previousPrimaryValue: string;
  healedWithValue: string;
}

/**
 * Singleton: every test worker writes healing events to the same
 * newline-delimited JSON file, which the GitLab pipeline later parses to
 * decide whether to flag a "tests passed but locators drifted" warning.
 */
export class HealingLogger {
  private static instance: HealingLogger;
  private readonly logPath: string;

  private constructor() {
    const dir = path.resolve("test-results");
    mkdirSync(dir, { recursive: true });
    this.logPath = path.join(dir, "healing-events.jsonl");
  }

  static getInstance(): HealingLogger {
    if (!this.instance) this.instance = new HealingLogger();
    return this.instance;
  }

  log(entry: HealingLogEntry): void {
    appendFileSync(this.logPath, JSON.stringify(entry) + "\n", "utf-8");
    console.warn(
      `[self-healing] "${entry.descriptorId}" on "${entry.pageKey}" recovered via fallback #${entry.healedIndex} ` +
        `(${entry.previousPrimaryValue} -> ${entry.healedWithValue})`,
    );
  }
}
