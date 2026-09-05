import { redirect } from "next/navigation";

// There is no Students tab: `TEACHER_NAV` has five, and a student is reached
// through Classes -> a class -> that student. This route was an unstyled
// placeholder reading "Placeholder - built per the UI/UX spec", unlinked from
// the nav but reachable by URL, so the only way to find it was to be shown
// scaffolding.
//
// Classes is where students actually live, so that is where this goes rather
// than to a 404 or an invented screen no frame describes.
export default function TeacherStudentsPage() {
  redirect("/teacher/classes");
}
