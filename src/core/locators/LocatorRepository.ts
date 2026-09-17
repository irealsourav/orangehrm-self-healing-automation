import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { LocatorCandidate, LocatorDescriptor, LocatorPageFile } from "@core/locators/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCATORS_DIR = path.resolve(__dirname, "../../data/locators");

/**
 * Repository pattern: all reads/writes of locator definitions go through
 * here. Callers never touch the JSON files directly, so the on-disk format
 * (or a future move to a real DB) can change without touching Page Objects.
 */
export class LocatorRepository {
  private static cache = new Map<string, LocatorPageFile>();

  private static filePath(pageKey: string): string {
    return path.join(LOCATORS_DIR, `${pageKey}.json`);
  }

  private static load(pageKey: string): LocatorPageFile {
    const cached = this.cache.get(pageKey);
    if (cached) return cached;

    const file = this.filePath(pageKey);
    if (!existsSync(file)) {
      throw new Error(`No locator file found for page "${pageKey}" at ${file}`);
    }
    const parsed = JSON.parse(readFileSync(file, "utf-8")) as LocatorPageFile;
    this.cache.set(pageKey, parsed);
    return parsed;
  }

  private static persist(pageKey: string, data: LocatorPageFile): void {
    this.cache.set(pageKey, data);
    writeFileSync(this.filePath(pageKey), JSON.stringify(data, null, 2) + "\n", "utf-8");
  }

  static get(pageKey: string, id: string): LocatorDescriptor {
    const descriptor = this.load(pageKey)[id];
    if (!descriptor) {
      throw new Error(`No locator descriptor "${id}" registered for page "${pageKey}"`);
    }
    return descriptor;
  }

  /**
   * Called when a fallback candidate (not index 0) resolved the element.
   * Reorders candidates so the winner becomes primary next run, and appends
   * a healing-history entry for auditability.
   */
  static promote(pageKey: string, id: string, winningIndex: number): void {
    const data = this.load(pageKey);
    const descriptor = data[id];
    if (!descriptor || winningIndex === 0) return;

    const candidates = [...descriptor.candidates];
    const [winner] = candidates.splice(winningIndex, 1);
    if (!winner) return;
    const previousPrimary = candidates[0] ?? descriptor.candidates[0];
    candidates.unshift(winner);

    const updated: LocatorDescriptor = {
      ...descriptor,
      candidates,
      healHistory: [
        ...(descriptor.healHistory ?? []),
        {
          timestamp: new Date().toISOString(),
          previousPrimary: previousPrimary as LocatorCandidate,
          healedWith: winner,
          healedIndex: winningIndex,
        },
      ],
    };

    this.persist(pageKey, { ...data, [id]: updated });
  }

  /** Used by the offline `heal-locator` agent skill to add a brand-new candidate. */
  static addCandidate(pageKey: string, id: string, candidate: LocatorCandidate): void {
    const data = this.load(pageKey);
    const descriptor = data[id];
    if (!descriptor) {
      throw new Error(`Cannot add candidate: no descriptor "${id}" on page "${pageKey}"`);
    }
    const updated: LocatorDescriptor = {
      ...descriptor,
      candidates: [candidate, ...descriptor.candidates],
    };
    this.persist(pageKey, { ...data, [id]: updated });
  }
}
