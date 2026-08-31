"use client";

import { useCallback } from "react";
import {
  teacherHomeApi,
  type ActivityRow,
  type ClassPulseRow,
  type TeacherHomeIntelligence,
} from "@/lib/api/teacherHome";
import { useLiveQuery } from "./useLiveQuery";

/**
 * C16a's class pulse and Home's activity list.
 *
 * BANDING IS OURS. The endpoint returns `engagement`, `comprehension` and
 * `focus` as numbers; C16a's tiles must read as words. The thresholds below
 * are a frontend decision - the API states no bands and the frame names no
 * cutoffs - so they are in one place, documented, and flagged to design
 * rather than scattered through the component.
 *
 * A metric of `null` is "not enough yet to say", which is different from a
 * low score and must never read as one.
 */

/** The frame's own three words, in the order they escalate. */
const BANDS: { min: number; word: string }[] = [
  { min: 0.75, word: "Strong" },
  { min: 0.45, word: "Steady" },
  { min: 0, word: "Building" },
];

export interface PulseTile {
  head: string;
  /** Null when the metric is - the tile says so rather than scoring it. */
  value: string | null;
}

export interface ClassPulse {
  classId: string;
  className: string;
  studentCount: number;
  tiles: PulseTile[];
  /** No metric has enough behind it yet. */
  quiet: boolean;
}

export interface HomeActivity {
  id: string;
  title: string;
  detail: string;
  when: string;
  /** Only set when `actionTarget` is an in-app path we can actually open. */
  href: string | null;
}

function band(v: number | null): string | null {
  if (v === null || Number.isNaN(v)) return null;
  const clamped = Math.max(0, Math.min(1, v));
  return BANDS.find((b) => clamped >= b.min)?.word ?? "Building";
}

function toPulse(row: ClassPulseRow): ClassPulse {
  const tiles = [
    { head: "Engagement", value: band(row.engagement) },
    { head: "Comprehension", value: band(row.comprehension) },
    { head: "Focus", value: band(row.focus) },
  ];
  return {
    classId: row.classId,
    className: row.className,
    studentCount: row.studentCount,
    tiles,
    quiet: tiles.every((t) => t.value === null),
  };
}

function when(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return "just now";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

function toActivity(row: ActivityRow): HomeActivity {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    when: when(row.occurredAt),
    // An absolute URL or an opaque token is not something this app can open,
    // and a row that navigates nowhere is worse than one that does not offer.
    href: row.actionTarget?.startsWith("/") ? row.actionTarget : null,
  };
}

export interface TeacherHomeState {
  pulse: ClassPulse[];
  activity: HomeActivity[];
  live: boolean;
  failed: boolean;
  loading: boolean;
}

export function useTeacherHome(): TeacherHomeState {
  const run = useCallback(() => teacherHomeApi.read(), []);
  const { data, failed, loading } = useLiveQuery<TeacherHomeIntelligence>(
    run,
    [],
  );
  return {
    pulse: (data?.classLearningPulse ?? []).map(toPulse),
    activity: (data?.recentActivity ?? []).map(toActivity),
    live: data !== null,
    failed,
    loading,
  };
}
