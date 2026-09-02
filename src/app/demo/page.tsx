import type { Metadata } from "next";
import { DemoPlayer } from "@/components/demo/DemoPlayer";

/**
 * The conference demo. Public, deterministic, and dependency-free.
 *
 * NOT behind the auth proxy: `proxy.ts` matches only `/teacher`, `/admin` and
 * the two auth doors, so this route needs no session - which is the point.
 * A demo that can fail to sign in is a demo that can fail on stage.
 *
 * `?recording=true` adds the presenter's scene overlay. It is opt-in so it can
 * never appear in the room by accident.
 */
export const metadata: Metadata = {
  title: "Teacher Console - Nevo",
  robots: { index: false, follow: false },
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ recording?: string }>;
}) {
  const { recording } = await searchParams;
  return <DemoPlayer recording={recording === "true"} />;
}
