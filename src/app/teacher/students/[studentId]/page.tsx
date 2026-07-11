// Next.js 16: `params` is a Promise and must be awaited.
export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2">
      <p className="text-xs tracking-[0.2em] uppercase text-nevo-near-black/40">Teacher</p>
      <h1 className="text-xl font-medium text-nevo-navy">Student profile</h1>
      <p className="text-sm text-nevo-near-black/60">
        Placeholder for <span className="font-mono">{studentId}</span> — built per the UI/UX spec.
      </p>
    </main>
  );
}
