import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Landing narrative, first half (frames: hero + chapters 01-03).
 * Styling is lifted verbatim from the design frame - inline `clamp()` values
 * and rgba tints are the contract, so they stay literal rather than being
 * translated into Tailwind tokens.
 */

const wordMask: CSSProperties = {
  display: "inline-block",
  overflow: "hidden",
  verticalAlign: "top",
  padding: "0.04em 0.14em 0.26em",
  margin: "-0.04em -0.14em -0.26em",
};

/** One masked hero word; `useLandingMotion` slides it up at `delay` ms.
 *  SSR paints it VISIBLE (the headline is the page's LCP element - hiding it
 *  in markup deferred LCP behind hydration); the hook applies the masked
 *  start position and animates, matching the data-reveal pattern. */
function Word({ text, delay }: { text: string; delay: number }) {
  return (
    <span style={wordMask}>
      <span data-word data-delay={delay} style={{ display: "inline-block" }}>
        {text}
      </span>
    </span>
  );
}

const LINE_ONE: [string, number][] = [
  ["Every", 360],
  ["mind", 430],
  ["has", 500],
  ["its", 560],
  ["own", 620],
  ["language.", 690],
];
const LINE_TWO: [string, number][] = [
  ["Nevo", 940],
  ["learns", 1010],
  ["to", 1080],
  ["speak", 1150],
  ["it.", 1220],
];

function joinWords(words: [string, number][]) {
  return words.map(([text, delay], i) => (
    <span key={text}>
      {i > 0 ? " " : null}
      <Word text={text} delay={delay} />
    </span>
  ));
}

export function HeroSection() {
  return (
    <section
      id="nv-open"
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px 0",
        boxSizing: "border-box",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <canvas
        id="nv-canvas"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        id="nv-hero-content"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1040,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          willChange: "transform,opacity",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 1.0,
            fontSize: "clamp(42px,8.6vw,112px)",
          }}
        >
          <span style={{ display: "block", color: "#2b2b2f" }}>
            {joinWords(LINE_ONE)}
          </span>
          <span
            style={{ display: "block", color: "#3b3f6e", marginTop: "0.08em" }}
          >
            {joinWords(LINE_TWO)}
          </span>
        </h1>
        <p
          data-reveal="load"
          data-delay="1560"
          data-dur="700"
          style={{
            margin: "34px 0 0",
            fontSize: "clamp(16px,1.8vw,19px)",
            lineHeight: 1.6,
            color: "rgba(43,43,47,0.7)",
            maxWidth: 520,
            textWrap: "pretty",
          }}
        >
          Watch a lesson adapt to a child, before you read a single word about
          how it works.
        </p>
      </div>
      <div
        id="nv-cue"
        data-reveal="load"
        data-delay="2000"
        data-dur="800"
        style={{
          position: "absolute",
          bottom: 34,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          willChange: "opacity",
        }}
      >
        <span
          style={{
            position: "relative",
            width: 1,
            height: 52,
            background: "rgba(59,63,110,0.16)",
            overflow: "hidden",
            display: "block",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1,
              height: 20,
              background: "#3b3f6e",
            }}
          />
        </span>
      </div>
    </section>
  );
}

const chapterH2: CSSProperties = {
  margin: "20px 0 0",
  fontWeight: 600,
  letterSpacing: "-0.025em",
  lineHeight: 1.05,
  fontSize: "clamp(30px,4.6vw,52px)",
  color: "#2b2b2f",
  textWrap: "balance",
};

const chapterBody: CSSProperties = {
  margin: "24px 0 0",
  fontSize: "clamp(16px,1.7vw,18px)",
  lineHeight: 1.7,
  color: "rgba(43,43,47,0.75)",
  maxWidth: 400,
  textWrap: "pretty",
};

export function LessonSection() {
  return (
    <section
      id="nv-lesson"
      style={{
        background: "#f7f1e6",
        minHeight: "96vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(80px,13vh,140px) clamp(24px,7vw,120px)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          gap: "clamp(40px,7vw,96px)",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ flex: "1 1 380px", maxWidth: 480 }}>
          <h2 data-reveal="scroll" data-delay="80" style={chapterH2}>
            Start with a single lesson.
          </h2>
          <p data-reveal="scroll" data-delay="180" style={chapterBody}>
            This is how every child receives it today. The same words, at the
            same pace, for thirty different minds in the room.
          </p>
        </div>
        <div
          data-reveal="scroll"
          data-delay="240"
          data-dur="700"
          data-dy="48"
          style={{ flex: "1 1 340px", maxWidth: 400, width: "100%" }}
        >
          <div
            style={{
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid rgba(59,63,110,0.10)",
              boxShadow: "0 24px 60px rgba(43,43,47,0.18)",
              background: "#f7f1e6",
            }}
          >
            <Image
              src="/landing/lp-lesson-phone.png"
              alt="A student's Nevo lesson on photosynthesis, with Simplify, Expand and Slower controls in the top bar"
              width={1500}
              height={1948}
              sizes="(max-width: 640px) 100vw, 400px"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- 02 · It adapts: pinned scroll scrub over three student panels ---- */

const panelBase: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  boxSizing: "border-box",
  padding: "clamp(18px,3.4vh,38px) clamp(24px,3.5vw,38px)",
};

const panelTitle: CSSProperties = {
  fontWeight: 600,
  fontSize: "clamp(18px,2.2vw,22px)",
  color: "#2b2b2f",
  letterSpacing: "-0.01em",
  textAlign: "left",
};

const panelBadge: CSSProperties = {
  fontWeight: 600,
  textTransform: "uppercase",
  color: "#3b3f6e",
  background: "rgba(154,156,203,0.18)",
  padding: "4px 10px",
  borderRadius: 999,
  whiteSpace: "nowrap",
  fontSize: "9.5px",
  letterSpacing: "1.2px",
};

const panelHead: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  // On narrow phones the nowrap badge would crush the title to a word per
  // line; wrapping drops the badge to its own row instead.
  flexWrap: "wrap",
};

function FlowNode({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "12.5px",
        color: "rgba(43,43,47,0.55)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: "#9a9ccb",
        }}
      />
      {label}
    </span>
  );
}

function StepDot({ done }: { done: boolean }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: done ? "#3b3f6e" : "rgba(59,63,110,0.2)",
      }}
    />
  );
}

function AmaraPanel() {
  return (
    <div className="nv-panel" data-panel="0" style={panelBase}>
      <div style={panelHead}>
        <div style={panelTitle}>How a leaf turns light into food</div>
        <span style={panelBadge}>Confident &middot; she is ready for more</span>
      </div>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <FlowNode label="Sunlight in" />
        <span style={{ color: "rgba(43,43,47,0.3)" }}>&rarr;</span>
        <FlowNode label="Leaf works" />
        <span style={{ color: "rgba(43,43,47,0.3)" }}>&rarr;</span>
        <FlowNode label="Sugar out" />
      </div>
      <div
        style={{
          marginTop: 16,
          background: "#ede8dc",
          borderLeft: "4px solid #3b3f6e",
          borderRadius: 8,
          padding: "16px 18px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontSize: "10.5px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#9a9ccb",
          }}
        >
          New challenge
        </div>
        <div
          style={{
            marginTop: 8,
            fontWeight: 600,
            fontSize: "clamp(15px,1.7vw,16.5px)",
            lineHeight: 1.4,
            color: "#2b2b2f",
          }}
        >
          If the leaf could not get water, what breaks?
        </div>
        <div
          style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {["Sugar production", "Oxygen release"].map((opt) => (
            <span
              key={opt}
              style={{
                fontSize: "13.5px",
                color: "#2b2b2f",
                background: "#f7f1e6",
                border: "1px solid #ded7c8",
                borderRadius: 8,
                padding: "9px 14px",
                cursor: "pointer",
              }}
            >
              {opt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TundePanel() {
  return (
    <div className="nv-panel" data-panel="1" style={{ ...panelBase, opacity: 0 }}>
      <div style={panelHead}>
        <div style={panelTitle}>How a leaf turns light into food</div>
        <span style={panelBadge}>Guided &middot; one step at a time</span>
      </div>
      <div
        style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7 }}
      >
        <StepDot done />
        <StepDot done />
        <StepDot done={false} />
        <span
          style={{
            marginLeft: 6,
            fontSize: 12,
            color: "rgba(43,43,47,0.5)",
          }}
        >
          Working through it, step 2 of 3
        </span>
      </div>
      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 999,
              background: "#3b3f6e",
              color: "#f7f1e6",
              fontSize: 13,
              fontWeight: 600,
              flex: "0 0 auto",
            }}
          >
            1
          </span>
          <span style={{ fontSize: "14.5px", color: "#2b2b2f" }}>
            Light lands on the leaf.
          </span>
        </div>
        <div
          style={{
            marginLeft: 38,
            background: "#ede8dc",
            borderRadius: 8,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(43,43,47,0.7)" }}>
            Where does the energy come from?
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "#3b3f6e",
              background: "#f7f1e6",
              borderRadius: 999,
              padding: "5px 12px",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b3f6e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            Sunlight
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 999,
              background: "#3b3f6e",
              color: "#f7f1e6",
              fontSize: 13,
              fontWeight: 600,
              flex: "0 0 auto",
            }}
          >
            2
          </span>
          <span style={{ fontSize: "14.5px", color: "#2b2b2f" }}>
            It mixes light with water and air.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: 0.45,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 999,
              background: "transparent",
              border: "1.5px solid rgba(59,63,110,0.35)",
              color: "rgba(59,63,110,0.6)",
              fontSize: 13,
              fontWeight: 600,
              flex: "0 0 auto",
            }}
          >
            3
          </span>
          <span style={{ fontSize: "14.5px", color: "#2b2b2f" }}>
            Sugar is made for her energy.
          </span>
        </div>
      </div>
    </div>
  );
}

function ZainabPanel() {
  const blank: CSSProperties = {
    width: 26,
    height: 32,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  };
  const letter: CSSProperties = {
    width: 26,
    height: 32,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 600,
    background: "#f7f1e6",
    border: "1px solid #ded7c8",
    color: "#2b2b2f",
  };
  return (
    <div className="nv-panel" data-panel="2" style={{ ...panelBase, opacity: 0 }}>
      <div style={panelHead}>
        <div style={panelTitle}>How a leaf turns light into food</div>
        <span style={panelBadge}>Supported &middot; building up</span>
      </div>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          textAlign: "left",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: 14,
              background: "#ede8dc",
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="-3 -3 30 30"
              fill="none"
              stroke="#3b3f6e"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 18 4h3v3a7 7 0 0 1-10 13z" />
              <path d="M8 20c0-4 2-7 6-9" />
            </svg>
          </span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9a9ccb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            <span
              style={{ fontSize: "12.5px", color: "#3b3f6e", fontWeight: 500 }}
            >
              Sunlight comes in here
            </span>
          </span>
        </div>
        <div
          style={{
            flex: "1 1 120px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          {[
            "Water drawn up from the roots",
            "Air taken in through the leaf",
          ].map((line) => (
            <span
              key={line}
              style={{ fontSize: "12.5px", color: "rgba(43,43,47,0.7)" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "#9a9ccb",
                  marginRight: 7,
                  verticalAlign: "middle",
                }}
              />
              {line}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          background: "#ede8dc",
          borderRadius: 10,
          padding: "14px 16px",
          textAlign: "left",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "#2b2b2f" }}>
          What does the leaf make?
        </div>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={letter}>S</span>
          {[0, 1, 2].map((i) => (
            <span key={i} style={blank}>
              <span
                style={{
                  width: 16,
                  height: 2,
                  background: "rgba(59,63,110,0.3)",
                }}
              />
            </span>
          ))}
          <span style={letter}>r</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: "#9a9ccb" }}>
            she fills in the rest
          </span>
        </div>
      </div>
    </div>
  );
}

const RAILS: {
  phase: number;
  name: string;
  note: string;
  align: "left" | "center" | "right";
}[] = [
  { phase: 0, name: "Amara", note: "getting it quickly, ready for more", align: "left" },
  { phase: 1, name: "Tunde", note: "needs a moment, working through it", align: "center" },
  { phase: 2, name: "Zainab", note: "building from the ground up", align: "right" },
];

export function AdaptSection() {
  return (
    <section
      id="nv-adapt-track"
      style={{ position: "relative", height: "300vh", background: "#ede8dc" }}
    >
      <div
        id="nv-pin"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding:
            "clamp(46px,7.5vh,80px) clamp(20px,6vw,72px) clamp(16px,3.5vh,40px)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          data-reveal="scroll"
          data-dy="40"
          data-dur="780"
          style={{ textAlign: "center", maxWidth: 760 }}
        >
          <h2
            style={{
              margin: "clamp(8px,1.4vh,16px) 0 0",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.04,
              fontSize: "clamp(24px,min(4.4vw,5vh),50px)",
              color: "#2b2b2f",
              textWrap: "balance",
            }}
          >
            Now watch it meet the child.
          </h2>
          <p
            style={{
              margin: "clamp(8px,1.4vh,16px) auto 0",
              fontSize: "clamp(14px,min(1.6vw,2.4vh),17px)",
              lineHeight: 1.6,
              color: "rgba(43,43,47,0.7)",
              maxWidth: 460,
            }}
          >
            The same lesson. The same standard. As you scroll, Nevo changes
            what the child needs most: how deep, how fast, and how much
            support.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 560,
            margin: "clamp(14px,3vh,40px) auto 0",
          }}
        >
          <div
            style={{
              position: "relative",
              height: 1,
              background: "#ded7c8",
              margin: "0 8px",
            }}
          >
            <span
              id="nv-railthumb"
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#3b3f6e",
                transform: "translate(-50%,-50%)",
                transition: "left 120ms linear",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            {RAILS.map((r, i) => (
              <button
                key={r.name}
                className="nv-rail"
                data-phase={r.phase}
                style={{
                  flex: "0 1 30%",
                  textAlign: r.align,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                <span
                  className="nv-rail-name"
                  style={{
                    display: "block",
                    fontWeight: i === 0 ? 600 : 500,
                    fontSize: 15,
                    color: i === 0 ? "#2b2b2f" : "rgba(43,43,47,0.4)",
                    transition: "color 300ms ease",
                  }}
                >
                  {r.name}
                </span>
                <span
                  className="nv-rail-note"
                  style={{
                    display: "block",
                    marginTop: 2,
                    fontSize: "12.5px",
                    lineHeight: 1.4,
                    color:
                      i === 0 ? "rgba(43,43,47,0.55)" : "rgba(43,43,47,0.4)",
                  }}
                >
                  {r.note}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          id="nv-stage"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 600,
            margin: "clamp(12px,2.2vh,32px) auto 0",
            background: "#f7f1e6",
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(43,43,47,0.14)",
          }}
        >
          <AmaraPanel />
          <TundePanel />
          <ZainabPanel />
        </div>
      </div>
    </section>
  );
}

export function ClassroomSection() {
  return (
    <section
      id="nv-classroom"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#f7f1e6",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "clamp(80px,13vh,140px) clamp(24px,6vw,80px)",
        boxSizing: "border-box",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          width: 460,
          height: 460,
          borderRadius: 999,
          background: "rgba(154,156,203,0.16)",
          filter: "blur(80px)",
          top: -100,
          left: -120,
          animation: "nvFloat 12s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          width: 360,
          height: 360,
          borderRadius: 999,
          background: "rgba(237,232,220,0.75)",
          filter: "blur(60px)",
          bottom: -120,
          right: "6%",
          animation: "nvFloat2 15s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          gap: "clamp(40px,6vw,80px)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 340px", maxWidth: 460 }}>
          <h2 data-reveal="scroll" data-delay="80" style={chapterH2}>
            Thirty children. Thirty versions. One moment.
          </h2>
          <p data-reveal="scroll" data-delay="180" style={chapterBody}>
            About one in five children need something the standard lesson does
            not offer. Not a different lesson. A different path through the
            same one. In a Nevo classroom, that number stops deciding who keeps
            up. Every child receives the same lesson, in the shape that reaches
            them.
          </p>
        </div>
        <div
          data-reveal="scroll"
          data-dx="44"
          data-dur="760"
          style={{ flex: "1 1 380px", maxWidth: 520, width: "100%" }}
        >
          <div
            style={{
              background: "#ede8dc",
              borderRadius: 16,
              padding: "clamp(20px,3vw,28px)",
              boxShadow: "0 6px 24px rgba(43,43,47,0.08)",
            }}
          >
            <div
              id="nv-room"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6,1fr)",
                gap: 10,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
