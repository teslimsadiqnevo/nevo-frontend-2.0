import { describe, expect, it } from "vitest";
import { roleLabel, USER_ROLES } from "./permissions";

/**
 * A role, as something to show a person.
 *
 * The teacher sidebar rendered `MOCK_TEACHER.role` - the literal "Teacher" -
 * unconditionally, while the initials and name beside it were both correctly
 * gated on `signedIn`. It was the only ungated use of that fixture in the repo,
 * and it survived because the value is ACCIDENTALLY CORRECT for everyone who
 * can reach that console: `proxy.ts` admits only `teacher`. A fixture that
 * happens to be right is still not read from the session.
 */
describe("roleLabel", () => {
  it("names every role the backend actually sends", () => {
    for (const role of Object.values(USER_ROLES)) {
      expect(roleLabel(role)).toBeTruthy();
    }
  });

  it("uses the two admin roles' own names, since there is no plain admin", () => {
    // The backend splits it, and a signed-in proprietor really does come back
    // as `senco_admin` - so one "Admin" label would be wrong for one of them.
    expect(roleLabel(USER_ROLES.SENCO_ADMIN)).not.toBe(
      roleLabel(USER_ROLES.OTHER_ADMIN),
    );
  });

  it("says nothing for a role it does not recognise", () => {
    // Telling someone they hold a role they do not is worse than saying
    // nothing, and this set has grown before.
    expect(roleLabel("head_teacher")).toBeNull();
    expect(roleLabel("some_future_role")).toBeNull();
  });

  it("says nothing for an absent role", () => {
    // `identity?.role` is undefined until `users/me` lands.
    expect(roleLabel(undefined)).toBeNull();
    expect(roleLabel(null)).toBeNull();
    expect(roleLabel("")).toBeNull();
  });
});
