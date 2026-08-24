import Link from "next/link";

/**
 * Lesson-detail header actions (C06b). "Assign to a class" opens the C07i
 * assignment takeover with this lesson preselected (retiring the interim
 * toast); "Edit" routes into the upload flow. Pressable, never disabled.
 * "Review variants" (C16d) is the entry the frame never drew - flagged.
 */
export function LessonDetailActions({
  lessonId,
  variantsHref,
  compact = false,
}: {
  lessonId: string;
  variantsHref?: string;
  compact?: boolean;
}) {
  const h = compact ? "h-[42px] text-sm" : "h-11 text-[14.5px]";

  return (
    <div className="flex items-center gap-2.5">
      {variantsHref && (
        <Link
          href={variantsHref}
          className={`inline-flex cursor-pointer items-center rounded-[10px] px-3.5 font-medium text-nevo-navy transition-[background-color,transform] hover:bg-nevo-navy/6 active:scale-[0.99] ${h}`}
        >
          Review variants
        </Link>
      )}
      <Link
        href={`/teacher/lessons/assign?lesson=${lessonId}`}
        className={`inline-flex cursor-pointer items-center rounded-[10px] bg-nevo-navy px-5 font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-93 active:scale-[0.99] ${h}`}
      >
        Assign to a class
      </Link>
      <Link
        href="/teacher/lessons/upload"
        className={`inline-flex cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/35 px-[18px] font-medium text-nevo-navy transition-[background-color,transform] hover:bg-nevo-navy/6 active:scale-[0.99] ${h}`}
      >
        Edit
      </Link>
    </div>
  );
}
