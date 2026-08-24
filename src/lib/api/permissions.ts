import { api } from "./client";
import type { PermissionScope } from "@/lib/constants";

/**
 * Permission endpoints, typed against the deployed backend (openapi 2.0.0).
 * The scope strings mirror the backend PermissionScope enum exactly - see
 * src/lib/constants/permissions.ts.
 */

export interface PermissionsMe {
  user_id: string;
  school_id: string | null;
  role: string;
  scopes: PermissionScope[];
  /** Nav items the backend says this admin should see (D.3 dynamic nav). */
  navigation: string[];
}

export const permissionsApi = {
  /** The signed-in user's role + scopes. GET /api/v1/permissions/me */
  me: () => api.get<PermissionsMe>("/api/v1/permissions/me"),
};
