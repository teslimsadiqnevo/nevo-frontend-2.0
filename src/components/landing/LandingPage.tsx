"use client";

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { ConversationSection } from "./ConversationSection";
import { JoinSection, SchoolSection, TeacherSection } from "./ProofSections";
import {
  AdaptSection,
  ClassroomSection,
  HeroSection,
  LessonSection,
} from "./StorySections";
import { useLandingMotion } from "./useLandingMotion";

/**
 * The public marketing landing page (SCRUM-43 / SCRUM-81), a 1:1 port of
 * `nevo-design-outputs/landing page/Nevo Landing Page.dc.html`. It owns `/`;
 * every CTA converges on the single conversion form (ConversationSection).
 *
 * Hover/focus states and keyframes live in the scoped <style> block below
 * (`!important` because the reveal system writes inline transforms); layout
 * values stay inline and verbatim per the frame's recreation notes.
 */

const CSS = `
@keyframes nvFloat { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-22px,0); } }
@keyframes nvFloat2 { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(16px,-14px,0) scale(1.09); } }
@keyframes nvFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.nv-landing ::placeholder { color: rgba(154,156,203,0.7); }
.nv-landing select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
.nv-dark:hover { color: #2b2b2f !important; }
.nv-raise:hover { filter: brightness(1.12) !important; transform: translateY(-1px) !important; }
.nv-demo:hover { background: rgba(59,63,110,0.08) !important; }
.nv-bright:hover { filter: brightness(1.12) !important; }
.nv-field:focus { border-color: #3b3f6e !important; background: #f7f1e6 !important; }
@media (prefers-reduced-motion: reduce) {
  .nv-landing *, .nv-landing *::before, .nv-landing *::after { animation: none !important; transition: none !important; }
}
`;

const navLink: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "rgba(43,43,47,0.7)",
  cursor: "pointer",
  transition: "color 150ms ease",
};

const NAV_LINKS: { target: string; label: string }[] = [
  { target: "nv-adapt-track", label: "How it works" },
  { target: "nv-teacher", label: "Educators" },
  { target: "nv-school", label: "Schools" },
];

/** Sprite-cropped Nevo icon + the repo's wordmark (the frame's wordmark sprite
 * isn't in the mirror, so the shipped brand asset stands in at frame size). */
function Logo({ scale = 1 }: { scale?: number }) {
  return (
    <span
      aria-label="Nevo"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6 * scale,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18 * scale,
          height: 18 * scale,
          backgroundImage: "url('/landing/logo-icon-purple.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${113 * scale}px ${113 * scale}px`,
          backgroundPosition: `${-48 * scale}px ${-50 * scale}px`,
        }}
      />
      <img
        src="/brand/nevo-wordmark.png"
        alt=""
        // Reference update (10 Aug): wordmark crop shrank 50x16 -> 45x15; our
        // substitute keeps its -1px optical calibration against the crop box.
        style={{ display: "block", height: 13 * scale, width: "auto" }}
      />
    </span>
  );
}

const SPINE: { target: string; num: string; label: string }[] = [
  { target: "nv-lesson", num: "01", label: "Lesson" },
  { target: "nv-adapt-track", num: "02", label: "Adapts" },
  { target: "nv-classroom", num: "03", label: "Classroom" },
  { target: "nv-teacher", num: "04", label: "Teacher" },
  { target: "nv-school", num: "05", label: "School" },
  { target: "nv-join", num: "06", label: "Join" },
];

function ChapterSpine() {
  return (
    <div
      id="nv-spine"
      style={{
        position: "fixed",
        left: "clamp(20px,3.2vw,44px)",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 190,
        display: "none",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {SPINE.map((s) => (
        <button
          key={s.target}
          className="nv-spine-item"
          data-target={s.target}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          <span
            className="nv-spine-num"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: "rgba(43,43,47,0.32)",
              transition: "color 300ms ease",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {s.num}
          </span>
          <span
            className="nv-spine-dash"
            style={{
              width: 0,
              height: 1,
              background: "#3b3f6e",
              transition: "width 300ms ease",
            }}
          />
          <span
            className="nv-spine-lbl"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(43,43,47,0.32)",
              whiteSpace: "nowrap",
              opacity: 0,
              transition: "opacity 300ms ease, color 300ms ease",
            }}
          >
            {s.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function Footer() {
  const footLink: CSSProperties = {
    fontSize: 15,
    color: "rgba(43,43,47,0.7)",
    cursor: "pointer",
    transition: "color 150ms ease",
  };
  return (
    <footer
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#ede8dc",
        color: "#2b2b2f",
        padding: "clamp(64px,9vh,100px) clamp(24px,7vw,96px) 36px",
        boxSizing: "border-box",
        borderTop: "1px solid rgba(59,63,110,0.12)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 0,
          right: -30,
          bottom: -50,
          width: 260,
          height: 260,
          backgroundImage: "url('/landing/logo-icon-purple.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: "clamp(36px,6vw,88px)",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 320px", maxWidth: 440 }}>
            <Logo scale={1.12} />
            <p
              style={{
                margin: "24px 0 0",
                fontSize: "clamp(21px,2.6vw,28px)",
                lineHeight: 1.28,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "#2b2b2f",
                maxWidth: 360,
                textWrap: "balance",
              }}
            >
              Adaptive learning, in every child&apos;s own language.
            </p>
          </div>
          <div style={{ display: "flex", gap: "clamp(40px,6vw,84px)", flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#9a9ccb",
                }}
              >
                Explore
              </div>
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 13,
                }}
              >
                {[
                  ["nv-adapt-track", "How it adapts"],
                  ["nv-teacher", "For teachers"],
                  ["nv-school", "For schools"],
                  ["nv-join", "Founding partners"],
                ].map(([target, label]) => (
                  <a
                    key={target}
                    data-scroll={target}
                    className="nv-dark"
                    style={footLink}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#9a9ccb",
                }}
              >
                Get in touch
              </div>
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 13,
                }}
              >
                <a
                  href="mailto:support@nevolearning.com"
                  className="nv-dark"
                  style={{ ...footLink, cursor: undefined }}
                >
                  support@nevolearning.com
                </a>
                <span style={{ fontSize: 15, color: "rgba(43,43,47,0.7)" }}>
                  Lagos, Nigeria
                </span>
                <span style={{ fontSize: 15, color: "rgba(43,43,47,0.7)" }}>
                  By appointment, worldwide
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: "clamp(44px,6vh,72px)",
            paddingTop: 24,
            borderTop: "1px solid rgba(59,63,110,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(43,43,47,0.5)" }}>
            &copy; 2026 Nevo. Made in Lagos.
          </span>
          <span style={{ fontSize: 13, color: "rgba(43,43,47,0.5)" }}>
            Privacy-first by design. No child is ever labelled.
          </span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  useLandingMotion();
  return (
    <div
      className="nv-landing"
      style={{
        background: "#f7f1e6",
        color: "#2b2b2f",
        overflowX: "clip",
        position: "relative",
        width: "100%",
      }}
    >
      <style>{CSS}</style>

      <div
        id="nv-progress"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: "0%",
          background: "#3b3f6e",
          zIndex: 220,
          transition: "width 80ms linear",
        }}
      />

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: "flex",
          justifyContent: "center",
          padding: "12px 0",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      >
        <div
          id="nv-nav"
          style={{
            pointerEvents: "auto",
            width: "min(1080px, calc(100% - 40px))",
            height: 54,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px 0 18px",
            borderRadius: 16,
            background: "transparent",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "none",
            transition: "background 300ms ease, box-shadow 300ms ease",
          }}
        >
          <Logo />
          <div
            id="nv-navlinks"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(16px,2.6vw,32px)",
            }}
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.target}
                data-scroll={l.target}
                className="nv-dark"
                style={navLink}
              >
                {l.label}
              </a>
            ))}
            {/* Reference (20 Aug sync): BOTH nav CTAs, grouped - the outlined
                "Watch demo" (-> adapt scrub) beside the navy "Start the
                conversation" (-> form). The 10 Aug port dropped the navy one
                off a truncated diff; restored. */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                data-scroll="nv-adapt-track"
                className="nv-demo"
                style={{
                  boxSizing: "border-box",
                  border: "1px solid #3b3f6e",
                  background: "transparent",
                  color: "#3b3f6e",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  height: 34,
                  padding: "0 16px",
                  borderRadius: 6,
                  transition: "background 150ms ease",
                }}
              >
                Watch demo
              </button>
              <button
                data-scroll="nv-form-sec"
                className="nv-raise"
                style={{
                  border: "none",
                  background: "#3b3f6e",
                  color: "#f7f1e6",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  height: 34,
                  padding: "0 16px",
                  borderRadius: 6,
                  boxShadow: "0 4px 14px rgba(59,63,110,0.22)",
                  transition: "filter 150ms ease, transform 150ms ease",
                }}
              >
                Start the conversation
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ChapterSpine />

      <HeroSection />
      <LessonSection />
      <AdaptSection />
      <ClassroomSection />
      <TeacherSection />
      <SchoolSection />
      <JoinSection />
      <ConversationSection />
      <Footer />
    </div>
  );
}
