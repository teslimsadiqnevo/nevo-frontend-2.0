"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  TOSSE_INTENTS,
  TOSSE_ROLES,
  tosseApi,
  type TosseIntent,
  type TosseRole,
} from "@/lib/api";

/**
 * TOSSE Founding Partner interest capture (SCRUM-117), built from
 * `nevo-design-outputs/TOSSE-Founding-Partner-Landing 1.html` - the canvas
 * holds ONE `TOSSE Frame` component rendered in three modes (empty / filled /
 * confirm), which are the three "frames" the brief names. Values below are
 * lifted from that frame verbatim.
 *
 * Frame-vs-spec calls. SCRUM-117 says "Follow the frames exactly", so the frame
 * wins wherever it actually draws the thing; the spec wins where the frame is
 * only a prototype:
 *
 * 1. FOCUS BORDER - spec says "on focus 2px solid navy"; the frame draws
 *    `1.5px solid #3b3f6e` over a `#fdfcf9` fill. FRAME WINS: it is the drawn
 *    authority, and 2px would shift the 56px field's inner text half a pixel.
 *    (#fdfcf9 is not pure white, so the no-pure-white law still holds.)
 * 2. SUBMIT ENABLEMENT - spec says "inactive at 40% opacity until all fields
 *    filled"; the frame keys `btnOpacity` off the intent card ALONE, and its
 *    `submit` validates nothing - it just flips to the confirm state. SPEC
 *    WINS: that is a behavioural rule the prototype never modelled.
 * 3. STUDENT COUNT - spec types it `number`; the frame uses a text input with
 *    `inputmode="numeric"` and kills the spinner. FRAME WINS for the control
 *    (no iOS spinners at a booth); the payload still carries a real number.
 *
 * The frame's outer chrome - 844px fixed height, 24px radius, drop shadow on a
 * #2b2b2f page - is canvas presentation of a 390x844 phone, not page design.
 * SCRUM-117 confirms it ("Page background: Cream #f7f1e6"), so on a phone the
 * real page is full-bleed cream with a 390px content column and natural
 * document scroll.
 *
 * BEYOND THE PHONE there is no frame to follow - the design ships one artboard,
 * and the QR code means nearly all real traffic arrives on a phone anyway. So
 * wider viewports do not get an invented layout: the column keeps its drawn
 * metrics exactly and instead takes back the frame's own chrome (24px radius,
 * hairline, a soft lift) from 600px up, which is the one desktop treatment the
 * design actually implies. The shadow is restated over cream - the frame's
 * `rgba(0,0,0,0.35)` was tuned for a #2b2b2f canvas and would read as dirt here.
 * Two-column and other wide compositions were deliberately not attempted: they
 * would be new design shipping the same day, with no review.
 */

const NAVY = "#3b3f6e";
const CREAM = "#f7f1e6";
const CREAM_ELEVATED = "#ede8dc";
const VIOLET = "#9a9ccb";
const NEAR_BLACK = "#2b2b2f";
const BORDER_IDLE = "rgba(59,63,110,0.4)";

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: NAVY,
};

const fieldStyle: CSSProperties = {
  width: "100%",
  height: 56,
  borderRadius: 12,
  border: `1.5px solid ${BORDER_IDLE}`,
  background: CREAM,
  padding: "0 16px",
  fontFamily: "inherit",
  fontSize: 16,
  color: NEAR_BLACK,
  outline: "none",
};

const bodyStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.6,
  color: NAVY,
};

const fieldGroup: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

/** The frame's intent card, minus the selected/unselected fill. */
const cardBase: CSSProperties = {
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "100%",
  // minHeight, not height: at 320px the longest label wraps to two lines, and a
  // fixed 56px would clip it. At the drawn 390px nothing wraps, so the card is
  // still exactly the 56px the frame specifies.
  minHeight: 56,
  padding: "10px 14px",
  borderRadius: 12,
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 400,
  color: NAVY,
  cursor: "pointer",
};

function Chevron() {
  return (
    <span aria-hidden="true" style={{ color: "rgba(59,63,110,0.5)", display: "flex" }}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

export function TosseInterestPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<TosseRole | "">("");
  const [school, setSchool] = useState("");
  const [students, setStudents] = useState("");
  const [code, setCode] = useState("+234");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState<TosseIntent | "">("");

  const [roleOpen, setRoleOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [submitted, setSubmitted] = useState(false);

  const roleWrap = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  // Close the role menu on an outside press - behaviour a native select has for
  // free and a div-based one has to be given.
  useEffect(() => {
    if (!roleOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!roleWrap.current?.contains(e.target as Node)) setRoleOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [roleOpen]);

  const studentCount = Number(students);
  const complete =
    name.trim() !== "" &&
    role !== "" &&
    school.trim() !== "" &&
    students !== "" &&
    Number.isFinite(studentCount) &&
    studentCount > 0 &&
    code.trim() !== "" &&
    phone.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    intent !== "";

  const sending = status === "sending";

  function pickRole(next: TosseRole) {
    setRole(next);
    setRoleOpen(false);
  }

  function openRoleMenu() {
    setRoleOpen(true);
    setActiveRole(role === "" ? 0 : TOSSE_ROLES.indexOf(role));
  }

  function onRoleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape") {
      setRoleOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!roleOpen) {
        openRoleMenu();
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveRole((i) => (i + step + TOSSE_ROLES.length) % TOSSE_ROLES.length);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (roleOpen) pickRole(TOSSE_ROLES[activeRole]);
      else openRoleMenu();
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // `complete` narrows `role` and `intent` off their empty-string states, so
    // the payload below needs no further guarding.
    if (!complete || sending) return;
    setStatus("sending");
    try {
      await tosseApi.submit({
        name: name.trim(),
        role,
        school_name: school.trim(),
        student_count: studentCount,
        phone: `${code.trim()} ${phone.trim()}`.replace(/\s+/g, " ").trim(),
        email: email.trim(),
        intent,
      });
      setSubmitted(true);
    } catch {
      // A booth lead IS the page, so a failure is shown and retried rather than
      // swallowed - the opposite of the marketing form's fire-and-forget, where
      // a silent drop costs one of many leads. Here the visitor is standing
      // beside a Nevo rep and can simply tap again; a fake confirmation would
      // lose the lead with nobody any the wiser.
      setStatus("error");
    }
  }

  return (
    <main className="tosse-page">
      <style>{`
        .tosse-page { flex: 1; min-height: 100dvh; background: ${CREAM}; }
        .tosse-panel { width: 100%; max-width: 390px; margin: 0 auto; background: ${CREAM}; }
        .tosse-confirm { min-height: 640px; }

        .tosse-in::placeholder { color: rgba(43,43,47,0.3); font-size: 14px; }
        .tosse-in:focus { background: #fdfcf9; border-color: ${NAVY}; }
        .tosse-phone:focus-within { background: #fdfcf9; border-color: ${NAVY}; }
        .tosse-role:focus-visible { background: #fdfcf9; border-color: ${NAVY}; }
        .tosse-role-row:hover { background: rgba(154,156,203,0.12); }
        .tosse-submit:hover:not(:disabled) { background: ${VIOLET}; }
        /* Unselected cards only - the violet fill is the selected state and a
           hover must not read as a second selection. Pointer devices only, so a
           touch does not leave a card looking hovered after the finger lifts. */
        @media (hover: hover) {
          .tosse-card[aria-pressed="false"]:hover { border-color: rgba(59,63,110,0.7); }
        }

        /* The design ships ONE 390x844 artboard - there is no desktop frame. So
           rather than invent a wide layout, the panel keeps the drawn metrics
           exactly and takes on the frame's OWN chrome (24px radius, hairline,
           soft lift) once there is room for it. A laptop then reads as
           deliberate instead of as a phone page stretched across the viewport. */
        @media (min-width: 600px) {
          .tosse-page {
            padding: 48px 24px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .tosse-panel {
            border-radius: 24px;
            border: 1px solid rgba(59,63,110,0.12);
            box-shadow: 0 24px 60px rgba(59,63,110,0.10);
            overflow: hidden;
          }
        }
        @media (min-width: 1024px) { .tosse-page { padding: 72px 24px; } }

        /* Landscape phones: a 640px confirmation column would force a scroll on
           a viewport with nothing below to scroll to. */
        @media (max-height: 760px) { .tosse-confirm { min-height: 60vh; } }
      `}</style>

      <div className="tosse-panel">
        <header
          style={{
            background: CREAM,
            borderBottom: "1px solid rgba(59,63,110,0.12)",
            padding: "22px 24px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed 90x32
              brand lockup; the optimiser adds a network hop for no gain. */}
          <img
            src="/brand/logo-combined-purple-tight.png"
            alt="Nevo"
            width={90}
            height={32}
            style={{ display: "block", height: 32, width: 90, objectFit: "contain" }}
          />
          <div style={{ fontSize: 14, fontWeight: 400, color: VIOLET }}>
            Learning, made fluid.
          </div>
        </header>

        <div style={{ padding: "32px 24px 48px" }}>
          {submitted ? (
            <div
              className="tosse-confirm"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", color: VIOLET }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12.5l2.5 2.5L16 9" />
                </svg>
              </div>
              <h1 style={{ margin: "16px 0 0", fontSize: 20, fontWeight: 600, color: NAVY }}>
                Thank you.
              </h1>
              <p style={{ ...bodyStyle, margin: "8px auto 0", maxWidth: 300 }}>
                We&apos;ll be in touch within 48 hours to discuss next steps for your
                school. Founding Partner spots are limited, and we&apos;re excited to have
                you on board.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <p style={{ ...bodyStyle, margin: 0 }}>
                Nevo is an adaptive learning engine that transforms your teachers&apos;
                lessons into personalised experiences for every student. Each learner gets
                content that adapts in real time to how they think, process, and retain
                information. Teachers get a dashboard showing exactly where every student
                stands. Parents get continuous visibility into how their child is learning.
                Schools get a competitive edge no one else in this market is offering.
              </p>
              <p style={{ ...bodyStyle, margin: "24px 0 0" }}>
                We&apos;re opening our Founding Partner programme to a select number of
                schools. Founding Partners get a locked preferential rate, personal
                onboarding for their team, and early access to the platform.
              </p>

              <h1 style={{ margin: "28px 0 0", fontSize: 20, fontWeight: 600, color: NAVY }}>
                Interested? Tell us about your school.
              </h1>

              <div
                style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div style={fieldGroup}>
                  <label htmlFor="tosse-name" style={labelStyle}>
                    Your name
                  </label>
                  <input
                    id="tosse-name"
                    className="tosse-in"
                    type="text"
                    autoComplete="name"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={fieldStyle}
                  />
                </div>

                <div style={fieldGroup}>
                  <span id="tosse-role-label" style={labelStyle}>
                    Your role
                  </span>
                  <div ref={roleWrap} style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="tosse-role"
                      role="combobox"
                      aria-haspopup="listbox"
                      aria-expanded={roleOpen}
                      aria-controls={listboxId}
                      aria-labelledby="tosse-role-label"
                      aria-activedescendant={roleOpen ? optionId(activeRole) : undefined}
                      onClick={() => (roleOpen ? setRoleOpen(false) : openRoleMenu())}
                      onKeyDown={onRoleKeyDown}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        height: 56,
                        borderRadius: 12,
                        padding: "0 16px",
                        boxSizing: "border-box",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                        outline: "none",
                        border: `1.5px solid ${roleOpen ? NAVY : BORDER_IDLE}`,
                        background: roleOpen ? "#fdfcf9" : CREAM,
                      }}
                    >
                      <span
                        style={
                          role
                            ? { fontSize: 16, color: NEAR_BLACK }
                            : { fontSize: 14, color: "rgba(43,43,47,0.3)" }
                        }
                      >
                        {role || "Select your role"}
                      </span>
                      <Chevron />
                    </button>

                    {roleOpen && (
                      <div
                        id={listboxId}
                        role="listbox"
                        aria-labelledby="tosse-role-label"
                        style={{
                          position: "absolute",
                          top: 62,
                          left: 0,
                          right: 0,
                          zIndex: 20,
                          background: CREAM_ELEVATED,
                          border: "1px solid rgba(59,63,110,0.25)",
                          borderRadius: 12,
                          padding: 6,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {TOSSE_ROLES.map((option, i) => {
                          const selected = role === option;
                          return (
                            <div
                              key={option}
                              id={optionId(i)}
                              role="option"
                              aria-selected={selected}
                              className="tosse-role-row"
                              onClick={() => pickRole(option)}
                              onMouseEnter={() => setActiveRole(i)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                padding: "11px 12px",
                                borderRadius: 8,
                                fontSize: 15,
                                color: NAVY,
                                cursor: "pointer",
                                background: selected
                                  ? "rgba(154,156,203,0.16)"
                                  : i === activeRole
                                    ? "rgba(154,156,203,0.12)"
                                    : "transparent",
                              }}
                            >
                              <span>{option}</span>
                              <span
                                aria-hidden="true"
                                style={
                                  selected
                                    ? { display: "inline-flex", color: VIOLET }
                                    : { display: "none" }
                                }
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M5 12l5 5 9-11" />
                                </svg>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div style={fieldGroup}>
                  <label htmlFor="tosse-school" style={labelStyle}>
                    School name
                  </label>
                  <input
                    id="tosse-school"
                    className="tosse-in"
                    type="text"
                    autoComplete="organization"
                    placeholder="Your school's name"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    style={fieldStyle}
                  />
                </div>

                <div style={fieldGroup}>
                  <label htmlFor="tosse-students" style={labelStyle}>
                    Approximate number of students
                  </label>
                  <input
                    id="tosse-students"
                    className="tosse-in"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 350"
                    value={students}
                    onChange={(e) => setStudents(e.target.value.replace(/\D/g, ""))}
                    style={fieldStyle}
                  />
                </div>

                <div style={fieldGroup}>
                  <label htmlFor="tosse-phone" style={labelStyle}>
                    Phone number
                  </label>
                  <div
                    className="tosse-phone"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: 56,
                      borderRadius: 12,
                      border: `1.5px solid ${BORDER_IDLE}`,
                      background: CREAM,
                      padding: "0 16px",
                    }}
                  >
                    <input
                      className="tosse-in"
                      type="tel"
                      aria-label="Country code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={{
                        width: 52,
                        padding: "0 8px 0 0",
                        border: "none",
                        borderRight: "1px solid rgba(59,63,110,0.2)",
                        marginRight: 10,
                        background: "transparent",
                        fontFamily: "inherit",
                        fontSize: 16,
                        color: "rgba(43,43,47,0.4)",
                        outline: "none",
                      }}
                    />
                    <input
                      id="tosse-phone"
                      className="tosse-in"
                      type="tel"
                      autoComplete="tel-national"
                      placeholder="801 234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: "none",
                        background: "transparent",
                        fontFamily: "inherit",
                        fontSize: 16,
                        color: NEAR_BLACK,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={fieldGroup}>
                  <label htmlFor="tosse-email" style={labelStyle}>
                    Email address
                  </label>
                  <input
                    id="tosse-email"
                    className="tosse-in"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={fieldStyle}
                  />
                </div>
              </div>

              <fieldset style={{ margin: "24px 0 0", padding: 0, border: "none" }}>
                <legend style={{ ...labelStyle, padding: 0 }}>
                  What would you like to do?
                </legend>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {TOSSE_INTENTS.map((option) => {
                    const selected = intent === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className="tosse-card"
                        aria-pressed={selected}
                        onClick={() => setIntent(option.value)}
                        style={{
                          ...cardBase,
                          ...(selected
                            ? { background: VIOLET, border: "none" }
                            : {
                                background: CREAM_ELEVATED,
                                border: `1.5px solid ${BORDER_IDLE}`,
                              }),
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {status === "error" && (
                <p
                  role="alert"
                  style={{
                    margin: "20px 0 0",
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: CREAM_ELEVATED,
                    borderLeft: `3px solid ${VIOLET}`,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: NAVY,
                  }}
                >
                  We couldn&apos;t send that just then. Please check your connection and
                  try again - nothing you typed has been lost.
                </p>
              )}

              <button
                type="submit"
                className="tosse-submit"
                disabled={!complete || sending}
                style={{
                  width: "100%",
                  // See the intent cards: minHeight so the label can wrap on a
                  // 320px screen without clipping, 52px everywhere it fits.
                  minHeight: 52,
                  padding: "10px 16px",
                  marginTop: 32,
                  border: "none",
                  borderRadius: 12,
                  background: NAVY,
                  color: CREAM,
                  fontFamily: "inherit",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: complete && !sending ? "pointer" : "not-allowed",
                  opacity: complete ? 1 : 0.4,
                }}
              >
                {sending ? "Sending..." : "Join the Founding Partner Programme"}
              </button>

              <p
                style={{
                  margin: "16px 0 0",
                  fontSize: 12,
                  color: "rgba(43,43,47,0.4)",
                  textAlign: "center",
                }}
              >
                Your information is kept confidential and used only to contact you about
                Nevo.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
