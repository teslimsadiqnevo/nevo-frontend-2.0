import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Landing narrative, second half (frames: chapters 04-06).
 * Inline values are lifted verbatim from the design frame.
 */

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

/** The mock browser chrome around product screenshots. */
function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(59,63,110,0.08)",
        boxShadow: "0 8px 32px rgba(43,43,47,0.16)",
      }}
    >
      <div
        style={{
          height: 34,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 14px",
          background: "#ede8dc",
          borderBottom: "1px solid #ded7c8",
        }}
      >
        {[0.22, 0.16, 0.1].map((a) => (
          <span
            key={a}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: `rgba(59,63,110,${a})`,
            }}
          />
        ))}
      </div>
      {/* next/image: the source shots are 2880x1800 - responsive srcset +
          modern formats + lazy (both sit below the fold). */}
      <Image
        src={src}
        alt={alt}
        width={2880}
        height={1800}
        sizes="(max-width: 1080px) 100vw, 640px"
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </div>
  );
}

export function TeacherSection() {
  return (
    <section
      id="nv-teacher"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#f7f1e6",
        minHeight: "96vh",
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
          width: 440,
          height: 440,
          borderRadius: 999,
          background: "rgba(154,156,203,0.14)",
          filter: "blur(85px)",
          top: "6%",
          right: -140,
          animation: "nvFloat 14s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          gap: "clamp(40px,6vw,88px)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 300px", maxWidth: 400 }}>
          <h2 data-reveal="scroll" data-delay="80" style={chapterH2}>
            The teacher stops guessing.
          </h2>
          <p data-reveal="scroll" data-delay="180" style={chapterBody}>
            No dashboard to decode. No scores to rank. A clear, human view of
            how each child is actually learning, written the way a thoughtful
            colleague would leave a note. Never a label. Never a diagnosis.
          </p>
        </div>
        <div
          data-reveal="scroll"
          data-delay="240"
          data-dur="700"
          style={{ flex: "1 1 580px", maxWidth: 800, width: "100%" }}
        >
          <BrowserFrame
            src="/landing/lp-teacher-home.png"
            alt="A Nevo teacher's dashboard: plain-language notes on Tunde, Amara and the class, each with one gentle next step"
          />
        </div>
      </div>
    </section>
  );
}

const SCHOOL_POINTS: { title: string; body: string; delay: number }[] = [
  {
    title: "Nothing new to install",
    body: "It runs on the tablets and laptops students already use.",
    delay: 120,
  },
  {
    title: "Nothing new to learn",
    body: "Teachers upload their own lessons; Nevo handles the rest.",
    delay: 200,
  },
  {
    title: "Nothing hidden",
    body: "Proprietors see which students are progressing, which concepts are landing, and how the platform is responding. In plain language.",
    delay: 280,
  },
];

export function SchoolSection() {
  return (
    <section
      id="nv-school"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#ede8dc",
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
        padding: "clamp(80px,13vh,140px) clamp(24px,7vw,120px)",
        boxSizing: "border-box",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          width: 520,
          height: 520,
          borderRadius: 999,
          background: "rgba(154,156,203,0.14)",
          filter: "blur(95px)",
          top: -160,
          left: -120,
          animation: "nvFloat2 16s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          width: 340,
          height: 340,
          borderRadius: 999,
          background: "rgba(247,241,230,0.6)",
          filter: "blur(70px)",
          bottom: -100,
          right: -60,
          animation: "nvFloat 18s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h2
          data-reveal="scroll"
          data-delay="80"
          style={{
            margin: "20px 0 0",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            fontSize: "clamp(30px,5vw,56px)",
            color: "#2b2b2f",
            maxWidth: 640,
            textWrap: "balance",
          }}
        >
          And the whole school feels it.
        </h2>
        <p
          data-reveal="scroll"
          data-delay="180"
          style={{
            margin: "26px 0 0",
            fontSize: "clamp(17px,1.9vw,20px)",
            lineHeight: 1.7,
            color: "rgba(43,43,47,0.8)",
            maxWidth: 580,
            textWrap: "pretty",
          }}
        >
          The proprietor opens one calm view: how learning is actually changing
          across the whole school. No new hardware, no teacher retraining, and
          never a child labelled or categorised.
        </p>
        <div
          data-reveal="scroll"
          data-delay="240"
          data-dur="700"
          style={{ margin: "clamp(30px,5vh,48px) 0 0" }}
        >
          <BrowserFrame
            src="/landing/lp-admin-school.png"
            alt="Nevo school overview: transformation indicators showing how the whole school's learning is growing"
          />
        </div>
        <div
          style={{
            marginTop: "clamp(30px,5vh,48px)",
            display: "flex",
            gap: "clamp(24px,5vw,56px)",
            flexWrap: "wrap",
          }}
        >
          {SCHOOL_POINTS.map((pt) => (
            <div
              key={pt.title}
              data-reveal="scroll"
              data-delay={pt.delay}
              style={{ flex: "1 1 240px" }}
            >
              <div
                style={{ fontWeight: 600, fontSize: 15, color: "#2b2b2f" }}
              >
                {pt.title}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "rgba(43,43,47,0.7)",
                }}
              >
                {pt.body}
              </div>
            </div>
          ))}
        </div>
        <p
          data-reveal="scroll"
          data-delay="360"
          style={{
            margin: "clamp(30px,5vh,44px) 0 0",
            fontSize: 16,
            lineHeight: 1.7,
            color: "rgba(43,43,47,0.6)",
            maxWidth: 620,
            borderTop: "1px solid #ded7c8",
            paddingTop: 28,
          }}
        >
          The Managing Director of Sterling Bank backed Nevo before we had a
          single school. That kind of conviction is not bought. It is earned by
          what the product does.
        </p>
      </div>
    </section>
  );
}

export function JoinSection() {
  // Reference update (20 Aug, "fp updated"): benefit rows top-align and wrap.
  const seatRow: CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
    padding: "20px 0",
    borderTop: "1px solid rgba(59,63,110,0.14)",
  };
  return (
    <section
      id="nv-join"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#ede8dc",
        color: "#2b2b2f",
        minHeight: "88vh",
        display: "flex",
        alignItems: "center",
        padding: "clamp(80px,13vh,140px) clamp(24px,7vw,120px)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1120,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          gap: "clamp(44px,7vw,104px)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 420px", maxWidth: 600 }}>
          <div
            data-reveal="scroll"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "#9a9ccb",
            }}
          >
            <span>Founding Partner</span>
            <span
              style={{
                flex: "0 0 auto",
                width: 48,
                height: 1,
                background: "rgba(154,156,203,0.5)",
              }}
            />
            <span style={{ color: "rgba(43,43,47,0.5)" }}>2026</span>
          </div>
          <h2
            data-reveal="scroll"
            data-delay="80"
            style={{
              margin: "26px 0 0",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.04,
              fontSize: "clamp(32px,5vw,60px)",
              color: "#2b2b2f",
              textWrap: "balance",
            }}
          >
            Be among the first schools to build this with us.
          </h2>
          <p
            data-reveal="scroll"
            data-delay="180"
            style={{
              margin: "24px 0 0",
              fontSize: "clamp(15px,1.5vw,17px)",
              lineHeight: 1.7,
              color: "rgba(43,43,47,0.78)",
              maxWidth: 480,
              textWrap: "pretty",
            }}
          >
            Every school that joins Nevo this first year becomes a Founding
            Partner. You secure a significantly reduced rate, locked for three
            years, and always pay below our standard rate for as long as you
            stay with Nevo. Founding Partner status is the lasting reward for
            being early.
          </p>
          <button
            data-scroll="nv-form-sec"
            data-reveal="scroll"
            data-delay="280"
            className="nv-raise"
            style={{
              marginTop: 36,
              border: "none",
              height: 52,
              padding: "0 28px",
              borderRadius: 10,
              background: "#3b3f6e",
              color: "#f7f1e6",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "filter 150ms ease, transform 150ms ease",
            }}
          >
            Request a private walkthrough
          </button>
        </div>
        <div
          data-reveal="scroll"
          data-delay="200"
          data-dx="30"
          data-dur="720"
          style={{ flex: "1 1 300px", maxWidth: 404, width: "100%" }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(43,43,47,0.5)",
            }}
          >
            What Founding Partners receive
          </div>
          <div style={{ marginTop: 10 }}>
            {[
              "First access to Nevo",
              "A significantly reduced rate, locked for three years",
              "Preferential pricing below our standard rate, permanently",
              "A direct hand in shaping the product",
            ].map((benefit, i, all) => (
              <div
                key={benefit}
                style={
                  i === all.length - 1
                    ? {
                        ...seatRow,
                        borderBottom: "1px solid rgba(59,63,110,0.14)",
                      }
                    : seatRow
                }
              >
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "rgba(43,43,47,0.4)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    flex: "1 1 auto",
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: "#2b2b2f",
                  }}
                >
                  {benefit}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 14,
              lineHeight: 1.65,
              color: "rgba(43,43,47,0.62)",
            }}
          >
            <span style={{ color: "#2b2b2f", fontWeight: 600 }}>
              Founding pricing is only for schools joining this first year.
            </span>{" "}
            Join now and those terms stay with you for as long as you stay with
            Nevo.
          </div>
        </div>
      </div>
    </section>
  );
}
