// Next.js 16: `params` is a Promise and must be awaited.
export default async function AdminTeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-sm">
      <p className="text-xs tracking-[0.2em] uppercase text-nevo-near-black/40">Admin</p>
      <h1 className="text-xl font-medium text-nevo-navy">Teacher detail</h1>
      <p className="text-sm text-nevo-near-black/60">
        Placeholder for <span className="font-mono">{teacherId}</span> — built per the UI/UX spec.
      </p>
    </main>
  );
}
