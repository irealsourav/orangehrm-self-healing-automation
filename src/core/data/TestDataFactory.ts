/**
 * Factory pattern (mirrors PageFactory): produces unique test data per call
 * instead of hardcoded literals. Necessary because tests run against a
 * shared, public, never-reset demo instance — two runs (or two parallel
 * workers) using the same "John Doe" would collide: a search test could
 * match a stale row from a previous run, a duplicate-username check could
 * pass for the wrong reason, etc. Every value is suffixed with a
 * timestamp + random fragment so each test run is self-isolating.
 */
function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface EmployeeData {
  firstName: string;
  lastName: string;
}

export class EmployeeDataFactory {
  static build(overrides: Partial<EmployeeData> = {}): EmployeeData {
    const suffix = uniqueSuffix();
    return {
      firstName: overrides.firstName ?? `QaFirst${suffix}`,
      lastName: overrides.lastName ?? `QaLast${suffix}`,
    };
  }
}

export interface UserAccountData {
  username: string;
  password: string;
}

export class UserAccountDataFactory {
  static build(overrides: Partial<UserAccountData> = {}): UserAccountData {
    const suffix = uniqueSuffix();
    return {
      username: overrides.username ?? `qa_user_${suffix}`,
      password: overrides.password ?? `Qa!Pass${suffix}123`,
    };
  }
}

/**
 * Leave-related tests (Apply Leave especially) apply to a single shared
 * account with only one usable leave type — the same collision risk as
 * employee/user names, but for dates instead. Same fix: a unique date per
 * call, so repeated same-day test runs don't all land on the same leave
 * record and read back stale status from a previous run.
 */
export class LeaveDateFactory {
  /** Returns a { from, to } pair, both in the app's own yyyy-dd-mm format, 1-300 days out, unique per call. */
  static buildFutureDateRange(): { from: string; to: string } {
    const offsetDays = 1 + Math.floor(Math.random() * 300);
    const from = new Date();
    from.setDate(from.getDate() + offsetDays);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from: toOxdDateString(from), to: toOxdDateString(to) };
  }
}

function toOxdDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${dd}-${mm}`;
}
