import type { Metadata } from "next";
import { LessonRoute } from "@/components/student/Lesson/LessonRoute";

/*
 * A title, so arriving here is announced as something.
 *
 * Without one this page inherited the root layout's "Nevo", which meant a
 * screen-reader user moving from the lessons list into a lesson heard "Nevo" -
 * and moving from the lesson to its summary heard nothing at all, because the
 * title did not change. Next's route announcer speaks on a title change.
 *
 * Static rather than `generateMetadata`: naming the lesson would mean reading
 * it on the server, and the token that read needs lives in localStorage, which
 * the server cannot see. That is the same reason this page is a thin shell.
 * The lesson's own name is announced inside the player instead.
 */
export const metadata: Metadata = {
  title: "Lesson - Nevo",
};

// Next.js 16: `params` is a Promise and must be awaited.
//
// The resolution itself is client-side: the lesson is read live from
// `GET /api/content/lessons/{id}` with a Bearer token that lives in
// localStorage, which the server cannot see. So this stays a thin shell and
// `LessonRoute` decides - see its docblock for why deciding here made a real
// lesson answer 404 on every hard load.
export default async function StudentLessonPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonRoute lessonId={lessonId} />;
}
