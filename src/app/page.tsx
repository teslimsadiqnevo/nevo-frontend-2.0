import { redirect } from "next/navigation";

// TEMP: default the site to the student onboarding (Welcome) screen for now.
// TODO(auth): restore role-based entry routing (FE Arch §2) once the auth
// contract exists — unauth → landing/login, authed → role dashboard.
export default function Home() {
  redirect("/student/onboarding");
}
