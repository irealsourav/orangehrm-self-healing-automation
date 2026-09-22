import { test } from "@core/fixtures/test-fixtures.js";

test.describe("Leave - Approve", () => {
  /**
   * SCRUM-10 is intentionally left unimplemented, not skipped silently.
   *
   * Confirmed live against the app: the `Admin` account has NO "Approve"
   * action available for a pending leave request, regardless of which
   * employee it belongs to. The row action menu on Leave List and the
   * "View Leave Details" page both expose only "Add Comment" and
   * "Cancel Leave" to Admin. This strongly suggests OrangeHRM's approval
   * workflow requires the logged-in user to be the employee's actual
   * configured Supervisor, not merely an Admin-role account.
   *
   * Needs: a Supervisor relationship set up in test data (e.g. assign the
   * Admin account as a test employee's Supervisor via PIM's Report-to
   * Configuration, or log in as an account that already is one) before this
   * can be automated for real. Tracked here as `test.fixme` — visible in
   * every test report as a known gap, not silently missing.
   */
  test.fixme(
    "SCRUM-10: approve a pending leave request (blocked — no Approve action available to Admin; needs a Supervisor relationship in test data)",
    async () => {
      // Intentionally not implemented — see comment above.
    },
  );
});
