"use client";

import { useContext } from "react";
import { LessonContext } from "@/context/LessonContext";

/** Access the active lesson session — lesson/session id + adaptation plan (§8). */
export function useLesson() {
  const ctx = useContext(LessonContext);
  if (ctx === undefined) {
    throw new Error("useLesson must be used within <LessonProvider>");
  }
  return ctx;
}
