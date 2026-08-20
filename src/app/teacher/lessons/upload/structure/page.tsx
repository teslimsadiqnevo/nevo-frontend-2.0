import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Structure - Nevo",
};

// C07d Structure Preview (SCRUM-102.2/102.5) - the three-level tree. Next slice.
export default function StructurePreviewPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2">
      <p className="text-xs tracking-[0.2em] uppercase text-nevo-near-black/40">
        Teacher
      </p>
      <h1 className="text-xl font-medium text-nevo-navy">Structure preview</h1>
      <p className="text-sm text-nevo-near-black/60">
        Placeholder - built per the UI/UX spec.
      </p>
    </main>
  );
}
