"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AgeBand } from "@/lib/profiling/bands";
import type { BaselineCapture } from "@/lib/profiling/capture";
import { AvatarBubble, ProfilingShell } from "./ProfilingShell";
import { SettleBadge } from "./GridSpanModule";
import { useTrialRunner } from "./useTrialRunner";

/**
 * Module 4 - Domain Probe (BP-M4: prior knowledge). A short adaptive knowledge
 * probe seeding the Knowledge Graph entry node per subject. Curriculum-mapped,
 * West-African localized questions; a selected option fills navy with no
 * correct/incorrect feedback, then the next loads. P1-3 gets three
 * picture-aided options; JSS and SS pick a subject first. The frames author one
 * exemplar per band - the extra items here follow their tone verbatim-adjacent
 * and are mock content until the item bank lands.
 * TODO(api): questions come from the adaptive IRT service, not this list.
 */

interface ProbeQuestion {
  context?: string;
  picture?: string;
  question: string;
  options: { text: string; icon?: string }[];
}

const ICONS = {
  fish: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 12c4-6 12-6 16 0-4 6-12 6-16 0z"/><path d="M18 12l4-3v6z"/><circle cx="7" cy="11" r="1.2" fill="#f7f1e6"/></svg>',
  cat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 8l2-4 3 3h6l3-3 2 4v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><circle cx="9.5" cy="12" r="1" fill="#f7f1e6"/><circle cx="14.5" cy="12" r="1" fill="#f7f1e6"/></svg>',
  bird: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7c3 0 4 3 7 3 4 0 5-4 8-4-1 5-4 9-8 9-3 0-6-3-7-8z"/></svg>',
  water: '<svg viewBox="0 0 24 24" fill="none" stroke="#3b3f6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="#3b3f6e" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 21.4l1.5-6.8L2.2 9l6.9-.7z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="#3b3f6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20C4 9 11 4 20 4c0 9-5 16-16 16z"/><path d="M4 20c4-5 8-8 12-10"/></svg>',
};

const QUESTIONS: Record<AgeBand, ProbeQuestion[]> = {
  p13: [
    {
      picture: ICONS.water,
      question: "Which animal lives in water?",
      options: [
        { text: "Fish", icon: ICONS.fish },
        { text: "Cat", icon: ICONS.cat },
        { text: "Bird", icon: ICONS.bird },
      ],
    },
    {
      picture: ICONS.sun,
      question: "Which one do you see in the sky at night?",
      options: [
        { text: "The moon", icon: ICONS.moon },
        { text: "The sun", icon: ICONS.sun },
        { text: "A fish", icon: ICONS.fish },
      ],
    },
    {
      picture: ICONS.leaf,
      question: "What colour are most leaves?",
      options: [
        { text: "Green", icon: ICONS.leaf },
        { text: "Blue", icon: ICONS.water },
        { text: "Yellow", icon: ICONS.star },
      ],
    },
  ],
  p46: [
    { question: "What is three-quarters of 12?", options: [{ text: "8" }, { text: "9" }, { text: "12" }, { text: "16" }] },
    { question: "Which gas do plants take in to make food?", options: [{ text: "Oxygen" }, { text: "Carbon dioxide" }, { text: "Nitrogen" }, { text: "Hydrogen" }] },
    { question: "The capital of Nigeria is:", options: [{ text: "Lagos" }, { text: "Abuja" }, { text: "Kano" }, { text: "Ibadan" }] },
    { question: "What is 15% of 200?", options: [{ text: "20" }, { text: "25" }, { text: "30" }, { text: "35" }] },
  ],
  jss: [
    {
      context: "A trader buys a bag of rice for ₦18,000. Later that week she sells it for ₦22,500.",
      question: "What is her percentage profit?",
      options: [{ text: "20%" }, { text: "25%" }, { text: "22.5%" }, { text: "45%" }],
    },
    { question: "Which of these is a renewable source of energy?", options: [{ text: "Coal" }, { text: "Solar" }, { text: "Diesel" }, { text: "Natural gas" }] },
    { question: "Simplify: 3x + 2x - x", options: [{ text: "4x" }, { text: "5x" }, { text: "6x" }, { text: "x" }] },
    { question: "The River Niger and River Benue meet at:", options: [{ text: "Onitsha" }, { text: "Lokoja" }, { text: "Makurdi" }, { text: "Yenagoa" }] },
  ],
  ss: [
    { question: "Which cell structure is the main site of photosynthesis?", options: [{ text: "Chloroplast" }, { text: "Mitochondrion" }, { text: "Ribosome" }, { text: "Nucleus" }] },
    { question: "If f(x) = 2x² - 3, what is f(2)?", options: [{ text: "5" }, { text: "1" }, { text: "8" }, { text: "13" }] },
    { question: "The economic term for a general rise in prices is:", options: [{ text: "Deflation" }, { text: "Inflation" }, { text: "Recession" }, { text: "Subsidy" }] },
    { question: "Which literary device gives human qualities to non-human things?", options: [{ text: "Simile" }, { text: "Personification" }, { text: "Hyperbole" }, { text: "Irony" }] },
  ],
};

const SUBJECTS: Record<string, string[]> = {
  jss: ["Mathematics", "English", "Basic Science", "Social Studies"],
  ss: ["Sciences", "Mathematics", "English Language", "Social Studies", "Other"],
};

export function DomainProbeModule({
  band,
  capture,
  onComplete,
}: {
  band: AgeBand;
  capture?: BaselineCapture;
  onComplete: () => void;
}) {
  const questions = QUESTIONS[band] ?? QUESTIONS.p46;
  const needsSubject = band === "jss" || band === "ss";
  const [subject, setSubject] = useState<string | null>(null);

  const { trial, picked, settling, pick } = useTrialRunner({
    module: "domain_probe",
    counts: [["probe", questions.length]],
    capture,
    onComplete,
  });

  if (needsSubject && subject === null) {
    return (
      <ProfilingShell filled={3} active={3}>
        <div className="flex min-h-0 w-full max-w-[520px] flex-1 flex-col items-center justify-center gap-6">
          <h2 className="text-center text-xl font-semibold text-balance text-nevo-navy">
            Which subject do you feel most at home in?
          </h2>
          <div className="grid w-full grid-cols-2 gap-3">
            {(SUBJECTS[band] ?? SUBJECTS.ss).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  capture?.record("probe_subject", { subject: s });
                  setSubject(s);
                }}
                className="cursor-pointer rounded-[10px] border-2 border-nevo-navy bg-nevo-cream px-4 py-[18px] text-center text-base font-medium text-nevo-near-black transition-transform active:scale-[0.97]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </ProfilingShell>
    );
  }

  const q = questions[Math.min(trial, questions.length - 1)];

  return (
    <ProfilingShell filled={settling ? 4 : 3} active={settling ? -1 : 3}>
      {!settling && <AvatarBubble text="Choose your answer" />}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
        {settling ? (
          <SettleBadge />
        ) : (
          <div className="flex w-full max-w-[520px] flex-col gap-6">
            <div className="flex flex-col items-center gap-3.5 rounded-[12px] border-2 border-nevo-navy bg-nevo-cream p-5">
              {q.picture && (
                <div
                  className="size-[110px] text-nevo-navy"
                  dangerouslySetInnerHTML={{ __html: q.picture }}
                />
              )}
              {q.context && (
                <p className="self-stretch text-[15px] leading-[1.55] text-pretty text-nevo-near-black">
                  {q.context}
                </p>
              )}
              <p className="text-center text-lg leading-[1.4] font-medium text-pretty text-nevo-near-black">
                {q.question}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {q.options.map((o, i) => {
                const selected = picked === i;
                return (
                  <button
                    key={o.text}
                    type="button"
                    onClick={() => pick(i, { subject: subject ?? undefined })}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-[10px] border-2 px-4 text-left text-base leading-[1.4]",
                      band === "p13" ? "min-h-16" : "min-h-[52px] py-3",
                      selected
                        ? "border-nevo-navy bg-nevo-navy text-nevo-cream"
                        : "border-nevo-navy bg-nevo-cream text-nevo-near-black",
                    )}
                  >
                    {o.icon && (
                      <span
                        className={cn("size-8 shrink-0", selected ? "text-nevo-cream" : "text-nevo-navy")}
                        dangerouslySetInnerHTML={{ __html: o.icon }}
                      />
                    )}
                    {o.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProfilingShell>
  );
}
