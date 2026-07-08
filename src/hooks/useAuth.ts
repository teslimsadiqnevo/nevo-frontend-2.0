"use client";

import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

/** Access auth state — current user, role, school, session (FE Architecture §8). */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
