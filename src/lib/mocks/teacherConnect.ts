import { studentSlug } from "./teacherStudents";

/**
 * Connect mock data (C10 + C10b). Individual threads with students, and the
 * teacher's control over whether a parent is looped in. Parent messages carry
 * a distinct soft-violet label. No class-wide broadcast in v1.
 *
 * TODO(api): replaced by the messaging endpoints when they exist.
 */

export type Sender = "student" | "teacher" | "parent";

export interface Message {
  id: string;
  from: Sender;
  /** Shown above parent and student bubbles; the teacher's own are unlabelled. */
  label?: string;
  text: string;
  /** The frame rewrites several messages shorter on tablet. */
  textTablet?: string;
  time?: string;
}

export interface Thread {
  id: string;
  studentName: string;
  initials: string;
  className: string;
  /** List-row preview; "You: " marks a message the teacher sent. */
  preview: string;
  time: string;
  /** null means no parent contact on file - the head shows a calm note
   *  instead of the include toggle, and it is never framed as a mistake. */
  parentName: string | null;
  parentIncluded: boolean;
  messages: Message[];
}

export const THREADS: Thread[] = [
  {
    id: studentSlug("Amara Okafor"),
    studentName: "Amara Okafor",
    initials: "AO",
    className: "JSS 2A",
    preview: "Mrs Okafor: Thank you ma, we'll go over it…",
    time: "2m",
    parentName: "Mrs Okafor",
    parentIncluded: true,
    messages: [
      {
        id: "m1",
        from: "student",
        label: "Amara",
        text: "Good afternoon ma. I finished the equations lesson but the last two questions were hard.",
        textTablet: "I finished but the last two questions were hard.",
      },
      {
        id: "m2",
        from: "teacher",
        text: "Well done for finishing, Amara. Let's look at those two together tomorrow morning - bring your working.",
        textTablet: "Let's look at those two together tomorrow - bring your working.",
      },
      {
        id: "m3",
        from: "parent",
        label: "Mrs Okafor · parent",
        text: "Thank you ma, we'll go over it this evening too.",
        textTablet: "Thank you ma, we'll go over it this evening.",
      },
    ],
  },
  {
    id: studentSlug("Tunde Adeyemi"),
    studentName: "Tunde Adeyemi",
    initials: "TA",
    className: "JSS 2A",
    preview: "Sorry ma, I wasn't feeling well that day.",
    time: "1h",
    parentName: null,
    parentIncluded: false,
    messages: [
      {
        id: "m1",
        from: "teacher",
        text: "Morning Tunde - I noticed you didn't finish Tuesday's lesson. All well? No rush, just checking in.",
      },
      {
        id: "m2",
        from: "student",
        label: "Tunde",
        text: "Sorry ma, I wasn't feeling well that day. I'll finish it today.",
      },
    ],
  },
  // The frame gives these three only as list previews, so each opens on the
  // single message that preview quotes rather than an invented history.
  {
    id: studentSlug("Chisom Eze"),
    studentName: "Chisom Eze",
    initials: "CE",
    className: "JSS 2A",
    preview: "You: Lovely work on the comprehension!",
    time: "3h",
    parentName: "Mrs Eze",
    parentIncluded: false,
    messages: [
      { id: "m1", from: "teacher", text: "Lovely work on the comprehension!" },
    ],
  },
  {
    id: studentSlug("Damilola Akinwande"),
    studentName: "Damilola Akinwande",
    initials: "DA",
    className: "JSS 2A",
    preview: "Thank you ma, I understand now.",
    time: "Yest",
    parentName: null,
    parentIncluded: false,
    messages: [
      {
        id: "m1",
        from: "student",
        label: "Damilola",
        text: "Thank you ma, I understand now.",
      },
    ],
  },
  {
    id: studentSlug("Fatima Musa"),
    studentName: "Fatima Musa",
    initials: "FM",
    className: "JSS 2A",
    preview: "See you in class tomorrow.",
    time: "Yest",
    parentName: "Mrs Musa",
    parentIncluded: false,
    messages: [
      {
        id: "m1",
        from: "student",
        label: "Fatima",
        text: "See you in class tomorrow.",
      },
    ],
  },
];

/** C10b's picker: every student the teacher can start a thread with. */
export interface ComposeStudent {
  name: string;
  className: string;
  initials: string;
  hasParent: boolean;
}

export const COMPOSE_STUDENTS: ComposeStudent[] = [
  { name: "Amara Okafor", className: "JSS 2A", initials: "AO", hasParent: true },
  { name: "Bello Ibrahim", className: "JSS 2B", initials: "BI", hasParent: true },
  { name: "Chisom Eze", className: "JSS 2A", initials: "CE", hasParent: true },
  { name: "Damilola Akinwande", className: "JSS 2A", initials: "DA", hasParent: false },
  { name: "Emeka Nwachukwu", className: "JSS 2B", initials: "EN", hasParent: true },
  { name: "Fatima Musa", className: "JSS 2A", initials: "FM", hasParent: true },
  { name: "Kolade Fashola", className: "SSS 1 Sciences", initials: "KF", hasParent: true },
  { name: "Ngozi Obi", className: "JSS 2B", initials: "NO", hasParent: false },
];

export const COMPOSE_CLASS_FILTERS = [
  "All classes",
  "JSS 2A",
  "JSS 2B",
  "SSS 1 Sciences",
];
