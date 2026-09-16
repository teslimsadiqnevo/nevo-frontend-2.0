"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { getToken } from "@/lib/auth/session";
import { ClassQrScreen } from "./ClassQr";

/**
 * C12 as a ROUTE, per design's 15 Sep ruling: "standalone route. Teachers
 * project it, read it aloud and return to it; a route links and reopens
 * cleanly."
 *
 * THE SCREEN ALREADY EXISTED. `ClassQrScreen` is the full-screen projection and
 * has been mounted from class detail's dialog since it was built; what was
 * missing was a URL. So this adds no design and no markup - it resolves a class
 * and hands the existing screen its two props. The inventory's shorthand
 * ("dialog only") would have sent someone to rebuild it.
 *
 * Resolution deliberately mirrors `ClassRoute`, because the ways this 404s
 * wrongly are the same ways that one did:
 *  - Nothing is decided before hydration. `getToken()` is false on the server,
 *    so deciding there renders "this page doesn't exist" for a teacher's own
 *    class.
 *  - `sample` is NOT resolution. A failed class list is not evidence the class
 *    is missing, and treating it as such 404s a real class whenever the read
 *    fails.
 *
 * NO FIXTURE FALLBACK, unlike ClassRoute. A projected join code is the one
 * thing on this console a room full of children will physically act on: a
 * sample code would send every one of them into a join flow for a class that
 * does not exist. Signed out, this route is simply not found.
 */
export function ClassCodeRoute({ classId }: { classId: string }) {
  const router = useRouter();
  const { liveClasses, live, loading } = useTeacherClasses();
  const hydrated = useHydrated();

  if (!hydrated || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-nevo-cream">
        <div className="size-[340px] animate-pulse rounded-[20px] bg-nevo-cream-elevated" />
      </div>
    );
  }

  const assigned = liveClasses.find((c) => c.classId === classId);

  if (!assigned) {
    // Resolved and genuinely not this teacher's class, or nobody is signed in.
    if (live || !getToken()) notFound();
    // The list could not be read. Not knowing is not the same as absent, and a
    // teacher standing in front of a class needs to be told which it is.
    return (
      <Unavailable classId={classId}>
        We couldn&rsquo;t reach your school just now, so we can&rsquo;t show
        this class&rsquo;s code. Try again in a moment.
      </Unavailable>
    );
  }

  if (!assigned.classCode) {
    // A real class that carries no join code. The QR encodes the code, so
    // there is nothing to project - say so rather than showing a QR that
    // resolves to an empty code.
    return (
      <Unavailable classId={classId}>
        {assigned.className} doesn&rsquo;t have a join code yet. Your school
        admin can set one up.
      </Unavailable>
    );
  }

  return (
    <ClassQrScreen
      className={assigned.className}
      code={assigned.classCode}
      // Back to the class, not `router.back()`: this route is meant to be
      // linked and bookmarked, and history may hold nothing to go back to.
      onClose={() => router.push(`/teacher/classes/${classId}`)}
    />
  );
}

function Unavailable({
  classId,
  children,
}: {
  classId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-nevo-cream px-6">
      <div className="flex max-w-[420px] flex-col items-center text-center">
        <p className="text-[17px] leading-[1.55] text-nevo-near-black/70">
          {children}
        </p>
        <Link
          href={`/teacher/classes/${classId}`}
          className="mt-6 inline-flex h-11 cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/35 px-4 text-sm font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
        >
          Back to the class
        </Link>
      </div>
    </div>
  );
}
