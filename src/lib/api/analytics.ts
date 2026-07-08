import { api } from "./client";

/**
 * Internal Operations & Intelligence Dashboard endpoints (FE Architecture §1;
 * Product Arch Part G). Restricted, internal-only surface.
 *
 * TODO: type returns; gate access to authorized internal users.
 */
export const analyticsApi = {
  getSchoolHealth: () => api.get("/api/analytics/schools"),
  getOutcomes: (params?: { schoolId?: string }) =>
    api.get("/api/analytics/outcomes", { params }),
};
