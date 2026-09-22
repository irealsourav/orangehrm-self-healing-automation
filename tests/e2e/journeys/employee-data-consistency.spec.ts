import { test, expect } from "@core/fixtures/test-fixtures.js";
import { EmployeeDataFactory } from "@core/data/TestDataFactory.js";

test.describe("[E2E] Employee Data Consistency Journey", () => {
  /**
   * Adjusted from SCRUM-19's original wording: the Directory card was
   * assumed to reflect a Nationality edit, but confirmed live it only shows
   * name, job title, and location — Nationality isn't surfaced there at
   * all. What IS genuinely true and end-to-end: the same employee, by name,
   * created in PIM is correctly discoverable via Directory search. The
   * Nationality edit is kept as a step (still exercises PIM's own
   * create -> edit sequence) but the assertion is on name consistency,
   * which is what Directory can actually verify. The Jira issue's Expected
   * Result was corrected to match.
   */
  test("SCRUM-20: employee name stays consistent from PIM through to Directory", async ({
    addEmployeePage,
    personalDetailsPage,
    directoryPage,
  }) => {
    const employee = EmployeeDataFactory.build();

    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee.firstName, employee.lastName);

    await personalDetailsPage.setNationality("Canadian");
    await personalDetailsPage.save();

    await directoryPage.goto();
    await directoryPage.searchByName(`${employee.firstName} ${employee.lastName}`);
    const text = await directoryPage.getFirstResultText();
    expect(text).toContain(employee.firstName);
    expect(text).toContain(employee.lastName);
  });
});
