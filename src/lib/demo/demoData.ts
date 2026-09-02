import { HOME_ACTIVITY, HOME_CLASSES, HOME_FLAGS } from "@/lib/mocks/teacherHome";
import { TEACHER_PROFILE } from "@/lib/mocks/teacherProfile";
import { getStudentProfile, type StudentProfileData } from "@/lib/mocks/teacherStudents";

/**
 * The demo's classroom - assembled from the product's OWN fixtures rather than
 * invented beside them.
 *
 * This matters more than it looks. The teacher console already ships a
 * coherent sample classroom: Adunni Adeyemi at Corona Secondary School, JSS 2A
 * Mathematics, with Amara Okafor and Tunde Adeyemi carrying written narratives
 * that agree with each other across the dashboard, the profile and the
 * recommend sheet. Writing a second dataset for the demo would have created
 * two sources of truth that drift, and the demo's whole claim is that the
 * audience is watching the real product.
 *
 * So this module NAMES the story and re-exports the pieces. If a fixture
 * changes, the demo follows it.
 *
 * THE STORY, and every beat of it is already in the data:
 *
 *   signal        Amara has been slower on written segments, three sessions
 *                 running - `HOME_FLAGS`
 *   investigate   her profile carries the same observation, plus the concept
 *                 mastery behind it - `getStudentProfile("amara-okafor")`
 *   activity      her recent sessions show where the time actually went
 *   action        the console's own suggestion: the listen-first version of
 *                 "Simplifying Expressions" - `profile.recommend`
 *   result        the recommendation lands on her timeline
 *
 * Nothing here is fetched. Every value is a module constant, so a fresh load,
 * a refresh and a tenth replay all render identically.
 */

export const DEMO_TEACHER = TEACHER_PROFILE;

/** The learner the story follows. Present in the fixtures with a full profile. */
export const DEMO_STUDENT_SLUG = "amara-okafor";

/**
 * Non-null by construction - `amara-okafor` is the fixture set's fully-written
 * profile. Typed as nullable by the getter, so it is resolved once here and
 * the scenes can rely on it.
 */
export const DEMO_STUDENT: StudentProfileData = (() => {
  const s = getStudentProfile(DEMO_STUDENT_SLUG);
  if (!s) {
    throw new Error(
      `Demo data is missing the "${DEMO_STUDENT_SLUG}" profile. The demo reads ` +
        "the product's own fixtures, so this means teacherStudents.ts changed.",
    );
  }
  return s;
})();

/** The flag that opens the story, pulled out by id rather than by position. */
export const DEMO_FLAG =
  HOME_FLAGS.find((f) => f.id === "amara-written-pace") ?? HOME_FLAGS[0];

export const DEMO_FLAGS = HOME_FLAGS;
export const DEMO_CLASSES = HOME_CLASSES;
export const DEMO_ACTIVITY = HOME_ACTIVITY;

/** The suggested option is the one the console itself marks `suggested`. */
export const DEMO_RECOMMENDATION =
  DEMO_STUDENT.recommend?.options.find((o) => o.suggested) ??
  DEMO_STUDENT.recommend?.options[0];

/**
 * Class-level figures for the opening dashboard beat.
 *
 * Derived where the fixtures support it and stated plainly where they do not.
 * The numbers are deliberately uneven - a class that is 86% of everything
 * reads as a mock-up, and the point of this scene is that the product looks
 * like it has been running in a real school.
 */
export const DEMO_CLASS_STATS = {
  className: "JSS 2A · Mathematics",
  learners: 28,
  active: 24,
  averageProgress: 78,
  needAttention: HOME_FLAGS.length,
  activeLessons: 3,
} as const;

/**
 * The concept spread behind the class average, for the insight beat.
 * Two tracks per concept, the same pair the student profile draws:
 * how well the class understands it, and the reading level the material asks
 * for. A gap points at the text rather than the idea.
 */
export const DEMO_CLASS_CONCEPTS = [
  { name: "Solving linear equations", understanding: 84, reading: 66 },
  { name: "Simplifying expressions", understanding: 79, reading: 61 },
  { name: "Algebraic fractions", understanding: 58, reading: 60 },
  { name: "Comprehension: prose texts", understanding: 86, reading: 72 },
] as const;
