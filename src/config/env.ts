/**
 * Singleton: one source of truth for run configuration, read once from
 * environment variables so every module (config, CI, fixtures) agrees on
 * the same values instead of each reading process.env ad hoc.
 */
export class EnvConfig {
  private static instance: EnvConfig;

  readonly baseUrl: string;
  readonly adminUsername: string;
  readonly adminPassword: string;

  private constructor() {
    this.baseUrl = process.env.BASE_URL ?? "https://opensource-demo.orangehrmlive.com";
    this.adminUsername = process.env.OHRM_USERNAME ?? "Admin";
    this.adminPassword = process.env.OHRM_PASSWORD ?? "admin123";
  }

  static getInstance(): EnvConfig {
    if (!this.instance) this.instance = new EnvConfig();
    return this.instance;
  }
}
