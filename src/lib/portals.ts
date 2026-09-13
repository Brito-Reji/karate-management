/**
 * Three product portals. Route groups in src/app use parentheses; URLs omit them.
 *
 * Student portal: one app for parents and adult students (not separate guardian UI).
 * - Minor: parent logs in, sees linked children.
 * - Adult: student logs in with own phone, sees own record.
 */

export const PORTALS = {
  admin: {
    routeGroup: "(admin)",
    subdomain: "admin",
    basePath: "/admin",
    apiPrefix: "/api/admin",
  },
  instructor: {
    routeGroup: "(instructor)",
    subdomain: "instructor",
    basePath: "/instructor",
    apiPrefix: "/api/register",
  },
  student: {
    routeGroup: "(student)",
    subdomain: "student",
    basePath: "/student",
    apiPrefix: "/api/student",
  },
} as const;

export type PortalId = keyof typeof PORTALS;

/** Age at which a student is expected to self-manage their portal account. */
export const STUDENT_SELF_MANAGE_AGE = 18;
