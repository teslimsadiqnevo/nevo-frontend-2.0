/**
 * Bridges the after-lesson assessment (in the immersive player) to the Review
 * Answers screen (a separate in-shell route). The player records which option
 * the student picked per question; the review screen reads it back to show
 * "your answer" vs the correct one.
 *
 * sessionStorage (not context) so it survives the route change from the bare
 * player to the in-shell review, and is naturally scoped to the tab/session.
 * TODO(api): the backend will own assessment attempts — swap this for that read.
 */
export interface ReviewAnswer {
  questionIndex: number;
  selectedId: string;
}

const key = (lessonId: string) => `nevo:review:${lessonId}`;

export function saveReviewAnswers(lessonId: string, answers: ReviewAnswer[]): void {
  try {
    sessionStorage.setItem(key(lessonId), JSON.stringify(answers));
  } catch {
    // ignore unavailable storage
  }
}

export function loadReviewAnswers(lessonId: string): ReviewAnswer[] {
  try {
    const raw = sessionStorage.getItem(key(lessonId));
    return raw ? (JSON.parse(raw) as ReviewAnswer[]) : [];
  } catch {
    return [];
  }
}
