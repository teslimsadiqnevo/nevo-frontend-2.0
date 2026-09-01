"use client";

import {
  DualTrackBars,
  TrendLine,
} from "@/components/admin/Reports/charts";

/**
 * The two admin chart forms, with representative values.
 *
 * This exists so the charts can be LOOKED AT. The palette validator checks
 * colour and says nothing about layout, so label collisions, geometry and
 * overflow have to be eyeballed - and the real screen sits behind an admin
 * session, which makes it awkward to open. Here they render on a public dev
 * route at the sizes they ship at.
 */
export function ChartsDemo() {
  const completion = [
    { label: "7 Apr", value: 0.52, display: "52%" },
    { label: "14 Apr", value: 0.58, display: "58%" },
    { label: "21 Apr", value: 0.55, display: "55%" },
    { label: "28 Apr", value: 0.64, display: "64%" },
    { label: "5 May", value: 0.71, display: "71%" },
    { label: "12 May", value: 0.69, display: "69%" },
    { label: "19 May", value: 0.78, display: "78%" },
  ];

  const adaptations = [
    { label: "7 Apr", value: 1.2, display: "1.2" },
    { label: "14 Apr", value: 1.6, display: "1.6" },
    { label: "21 Apr", value: 2.1, display: "2.1" },
    { label: "28 Apr", value: 1.9, display: "1.9" },
    { label: "5 May", value: 2.4, display: "2.4" },
    { label: "12 May", value: 2.8, display: "2.8" },
    { label: "19 May", value: 3.1, display: "3.1" },
  ];

  const mastery = [
    {
      key: "a",
      label: "Solving two-step linear equations",
      concept: 0.78,
      reading: 0.41,
      meta: "62 learners",
    },
    {
      key: "b",
      label: "Interpreting bar charts",
      concept: 0.71,
      reading: 0.48,
      meta: "58 learners",
    },
    { key: "c", label: "Fractions of a quantity", concept: 0.64, reading: 0.59, meta: "71 learners" },
    { key: "d", label: "Photosynthesis", concept: 0.55, reading: 0.53, meta: "44 learners" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl bg-nevo-cream-elevated px-6 py-[26px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
          Lessons finished
        </h3>
        <p className="m-0 mt-1 text-[13px] text-nevo-near-black/58">
          Single series, so no legend - the title says what is plotted. Only the
          end value is labelled.
        </p>
        <div className="mt-5">
          <TrendLine points={completion} max={1} ariaLabel="Completion rate over time" />
        </div>
      </div>

      <div className="rounded-xl bg-nevo-cream-elevated px-6 py-[26px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
          How often Nevo adapted
        </h3>
        <p className="m-0 mt-1 text-[13px] text-nevo-near-black/58">
          A second chart rather than a second axis on the first.
        </p>
        <div className="mt-5">
          <TrendLine
            points={adaptations}
            max={3.6}
            ariaLabel="Average adaptations per session over time"
          />
        </div>
      </div>

      <div className="rounded-xl bg-nevo-cream-elevated px-6 py-[26px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">
          Where the reading is getting in the way
        </h3>
        <p className="m-0 mb-5 mt-1 max-w-[62ch] text-[13px] leading-[1.6] text-nevo-near-black/58">
          Two series, so a legend is mandatory - and both are directly labelled,
          which is also how the violet&rsquo;s sub-3:1 contrast is discharged. A
          table view sits behind the toggle for the same reason.
        </p>
        <DualTrackBars rows={mastery} />
      </div>
    </div>
  );
}
