"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  readAcademic,
  readContact,
  schoolApi,
  type AcademicConfig,
  type RetentionPolicy,
  type School,
  type SchoolTerm,
} from "@/lib/api/school";
import {
  YEAR_GROUPS,
  defaultYearGroupLabel,
  setYearGroupLabels,
  type YearGroup,
} from "@/lib/constants/yearGroups";
import { cn } from "@/lib/utils";
import { CARD } from "../Roster/primitives";
import {
  NotBuiltNote,
  S_FIELD,
  S_LABEL,
  SaveRow,
  SettingsSection,
} from "./SettingsView";

/**
 * D12 General + data retention, and D12b calendar and taxonomy.
 *
 * RETENTION IS WRITTEN IN PLAIN WORDS, and D12 is emphatic about why: it is a
 * decision an admin should make understanding exactly what happens to a
 * deactivated student's records and when, not a buried toggle. So the selected
 * policy is restated as a sentence underneath, and the sentence names the
 * consequence - permanently deleted, cannot be recovered - rather than
 * softening it.
 *
 * The three options are the API's own (`contract`, `contract_plus_3_years`,
 * `contract_plus_7_years`). D12 also offers "12 months"; there is no enum
 * value for it, so it is not offered. Raised with backend rather than mapped
 * onto whichever value looked closest.
 *
 * THE TAXONOMY EDITOR IS THE ONE THAT MATTERS MOST DOWNSTREAM. It writes
 * `academicConfig.yearGroupLabels`, which `lib/constants/yearGroups.ts` reads
 * through its single lookup - so renaming P1 to "Year 1" here changes every
 * class row, student record and report at once. The underlying enum never
 * changes, which is what keeps cross-school comparison meaningful, and the
 * screen says so.
 */

type Phase = "idle" | "saving" | "saved" | "failed";
type Load = "loading" | "ready" | "failed";

const RETENTION: { value: RetentionPolicy; label: string; plain: string }[] = [
  {
    value: "contract",
    label: "For the length of our contract",
    plain:
      "their profile and learning history stay available until your contract with Nevo ends",
  },
  {
    value: "contract_plus_3_years",
    label: "Our contract, then three more years",
    plain:
      "their profile and learning history stay available until three years after your contract ends",
  },
  {
    value: "contract_plus_7_years",
    label: "Our contract, then seven more years",
    plain:
      "their profile and learning history stay available until seven years after your contract ends",
  },
];

/** The presets D12b offers. Each maps the enum onto a naming convention. */
const PRESETS: { id: string; name: string; example: string }[] = [
  { id: "nigerian", name: "Nigerian", example: "Nursery 1 · Primary 4 · JSS 2 · SS 1" },
  { id: "british", name: "British", example: "Nursery · Year 5 · Year 8 · Year 10" },
  { id: "american", name: "American", example: "Pre-K · Grade 4 · Grade 7 · Grade 10" },
];

const BRITISH: Record<YearGroup, string> = {
  n1: "Nursery 1", n2: "Nursery 2", kg1: "Reception", kg2: "Year 1",
  p1: "Year 2", p2: "Year 3", p3: "Year 4", p4: "Year 5", p5: "Year 6", p6: "Year 7",
  jss1: "Year 8", jss2: "Year 9", jss3: "Year 10",
  ss1: "Year 11", ss2: "Year 12", ss3: "Year 13",
};

const AMERICAN: Record<YearGroup, string> = {
  n1: "Pre-K 1", n2: "Pre-K 2", kg1: "Kindergarten", kg2: "Grade 1",
  p1: "Grade 2", p2: "Grade 3", p3: "Grade 4", p4: "Grade 5", p5: "Grade 6", p6: "Grade 7",
  jss1: "Grade 8", jss2: "Grade 9", jss3: "Grade 10",
  ss1: "Grade 11", ss2: "Grade 12", ss3: "Grade 13",
};

function presetMap(id: string): Record<YearGroup, string> | null {
  if (id === "british") return BRITISH;
  if (id === "american") return AMERICAN;
  return null;
}

export function SchoolSettings() {
  const [load, setLoad] = useState<Load>("loading");
  const [school, setSchool] = useState<School | null>(null);

  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");
  const [retention, setRetention] = useState<RetentionPolicy>("contract");
  const [general, setGeneral] = useState<Phase>("idle");

  const [academic, setAcademic] = useState<AcademicConfig>({});
  const [calendar, setCalendar] = useState<Phase>("idle");

  const [labels, setLabels] = useState<Record<string, string>>({});
  const [preset, setPreset] = useState<string>("nigerian");
  const [taxonomy, setTaxonomy] = useState<Phase>("idle");

  const hydrate = useCallback((s: School) => {
    const contact = readContact(s);
    const acad = readAcademic(s);
    setSchool(s);
    setName(s.name);
    setContactEmail(contact.contactEmail ?? "");
    setContactPhone(contact.contactPhone ?? "");
    setLocation(contact.location ?? "");
    setRetention(
      RETENTION.some((r) => r.value === s.retentionPolicy)
        ? (s.retentionPolicy as RetentionPolicy)
        : "contract",
    );
    setAcademic(acad);
    setLabels(acad.yearGroupLabels ?? {});
    setPreset(acad.taxonomyPreset ?? "nigerian");
    setYearGroupLabels(acad.yearGroupLabels);
    setLoad("ready");
  }, []);

  useEffect(() => {
    schoolApi.get().then(hydrate).catch(() => setLoad("failed"));
  }, [hydrate]);

  if (load === "loading") {
    return <div className={cn(CARD, "mt-5 h-[420px] animate-pulse")} />;
  }

  if (load === "failed" || !school) {
    return (
      <SettingsSection title="We couldn't load your settings">
        <p className="m-0 text-sm leading-[1.55] text-nevo-near-black/62">
          Nothing has changed - this is only about showing them to you. Try
          again in a moment.
        </p>
      </SettingsSection>
    );
  }

  const chosen = RETENTION.find((r) => r.value === retention) ?? RETENTION[0];
  const edited = Object.keys(labels).length > 0;

  const saveGeneral = () => {
    setGeneral("saving");
    schoolApi
      .update({ name: name.trim(), retentionPolicy: retention })
      .then(() =>
        schoolApi.saveContact({
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          location: location.trim(),
        }),
      )
      .then((s) => {
        hydrate(s);
        setGeneral("saved");
        setTimeout(() => setGeneral("idle"), 2200);
      })
      .catch(() => setGeneral("failed"));
  };

  const saveCalendar = () => {
    setCalendar("saving");
    schoolApi
      .saveAcademic({
        yearStart: academic.yearStart,
        yearEnd: academic.yearEnd,
        terms: academic.terms ?? [],
      })
      .then((s) => {
        hydrate(s);
        setCalendar("saved");
        setTimeout(() => setCalendar("idle"), 2200);
      })
      .catch(() => setCalendar("failed"));
  };

  const saveTaxonomy = () => {
    setTaxonomy("saving");
    schoolApi
      .saveAcademic({ yearGroupLabels: labels, taxonomyPreset: preset })
      .then((s) => {
        hydrate(s);
        setTaxonomy("saved");
        setTimeout(() => setTaxonomy("idle"), 2200);
      })
      .catch(() => setTaxonomy("failed"));
  };

  const applyPreset = (id: string) => {
    setPreset(id);
    const map = presetMap(id);
    if (!map) {
      setLabels({});
      return;
    }
    // Only store what actually differs from the Nigerian default, so a school
    // that later goes back to Nigerian has an empty map rather than a full one
    // that happens to match.
    const next: Record<string, string> = {};
    YEAR_GROUPS.forEach((yg) => {
      if (map[yg] !== defaultYearGroupLabel(yg)) next[yg] = map[yg];
    });
    setLabels(next);
  };

  const terms = academic.terms ?? [];
  const setTerms = (next: SchoolTerm[]) =>
    setAcademic((a) => ({ ...a, terms: next }));

  return (
    <>
      {/* ------------------------------------------------------------ GENERAL */}
      <SettingsSection title="General">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="set-name" className={S_LABEL}>
              School name
            </label>
            <input
              id="set-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={S_FIELD}
            />
          </div>
          <div className="flex gap-4 max-lg:flex-col">
            <div className="flex-1">
              <label htmlFor="set-email" className={S_LABEL}>
                Contact email
              </label>
              <input
                id="set-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={S_FIELD}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="set-phone" className={S_LABEL}>
                Contact phone
              </label>
              <input
                id="set-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={S_FIELD}
              />
            </div>
          </div>
          <div>
            <label htmlFor="set-location" className={S_LABEL}>
              Location
            </label>
            <input
              id="set-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lagos, Nigeria"
              className={S_FIELD}
            />
          </div>
        </div>
      </SettingsSection>

      {/* ---------------------------------------------------------- RETENTION */}
      <SettingsSection title="Data retention">
        <label htmlFor="set-retention" className={S_LABEL}>
          When a student is deactivated, keep their records for…
        </label>
        <select
          id="set-retention"
          value={retention}
          onChange={(e) => setRetention(e.target.value as RetentionPolicy)}
          className={cn(S_FIELD, "cursor-pointer")}
        >
          {RETENTION.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Plain words, and they name the consequence rather than soften it. */}
        <p className="m-0 mt-4 max-w-[62ch] text-sm leading-[1.6] text-nevo-near-black/70">
          When you deactivate a student, {chosen.plain} in case they return or a
          record is needed. After that they&rsquo;re permanently deleted and
          can&rsquo;t be recovered. Active students are never affected.
        </p>
        {school.retentionDays ? (
          <p className="m-0 mt-2 text-[12.5px] text-nevo-near-black/50">
            Currently {school.retentionDays.toLocaleString()} days.
          </p>
        ) : null}

        <SaveRow phase={general} onSave={saveGeneral} />
      </SettingsSection>

      {/* --------------------------------------------------- ACADEMIC YEAR */}
      <SettingsSection
        title="Academic year"
        note="Your terms decide what 'this half-term' means everywhere in Nevo."
      >
        <div className="flex gap-4 max-lg:flex-col">
          <div className="flex-1">
            <label htmlFor="set-ystart" className={S_LABEL}>
              Year starts
            </label>
            <input
              id="set-ystart"
              type="date"
              value={academic.yearStart ?? ""}
              onChange={(e) =>
                setAcademic((a) => ({ ...a, yearStart: e.target.value }))
              }
              className={S_FIELD}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="set-yend" className={S_LABEL}>
              Year ends
            </label>
            <input
              id="set-yend"
              type="date"
              value={academic.yearEnd ?? ""}
              onChange={(e) =>
                setAcademic((a) => ({ ...a, yearEnd: e.target.value }))
              }
              className={S_FIELD}
            />
          </div>
        </div>
        <p className="m-0 mt-2 text-[12.5px] text-nevo-near-black/50">
          The year label comes from these dates, so it can never disagree with
          them.
        </p>

        <div className="mt-6">
          <p className={S_LABEL}>Terms</p>
          <div className="flex flex-col gap-3">
            {terms.map((t, i) => (
              <div
                key={t.id}
                className="rounded-[10px] border border-nevo-near-black/12 px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <input
                    value={t.name}
                    onChange={(e) =>
                      setTerms(
                        terms.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    aria-label={`Term ${i + 1} name`}
                    className={cn(S_FIELD, "flex-1")}
                  />
                  <button
                    type="button"
                    onClick={() => setTerms(terms.filter((_, j) => j !== i))}
                    className="flex-none cursor-pointer text-[13px] font-semibold text-nevo-navy hover:opacity-75"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 flex gap-3 max-lg:flex-col">
                  <input
                    type="date"
                    value={t.start}
                    onChange={(e) =>
                      setTerms(
                        terms.map((x, j) =>
                          j === i ? { ...x, start: e.target.value } : x,
                        ),
                      )
                    }
                    aria-label={`Term ${i + 1} starts`}
                    className={cn(S_FIELD, "flex-1")}
                  />
                  <input
                    type="date"
                    value={t.end}
                    onChange={(e) =>
                      setTerms(
                        terms.map((x, j) =>
                          j === i ? { ...x, end: e.target.value } : x,
                        ),
                      )
                    }
                    aria-label={`Term ${i + 1} ends`}
                    className={cn(S_FIELD, "flex-1")}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setTerms([
                ...terms,
                {
                  id: `term-${terms.length + 1}-${terms.length}`,
                  name: `Term ${terms.length + 1}`,
                  start: "",
                  end: "",
                },
              ])
            }
            className="mt-3 cursor-pointer text-sm font-semibold text-nevo-navy hover:opacity-75"
          >
            Add a term
          </button>
          <p className="m-0 mt-2 text-[12.5px] text-nevo-near-black/50">
            {terms.length === 0
              ? "No terms set yet."
              : `${terms.length} ${terms.length === 1 ? "term" : "terms"} in your year.`}
          </p>
        </div>

        <SaveRow phase={calendar} onSave={saveCalendar} />
      </SettingsSection>

      {/* ----------------------------------------------------------- TAXONOMY */}
      <SettingsSection
        title="What year groups are called"
        note="These are only the names you see. The underlying year groups never change, so student records and comparisons across schools stay exactly as they are."
      >
        <div className="flex flex-col gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              aria-pressed={preset === p.id}
              className={cn(
                "cursor-pointer rounded-xl px-4 py-3.5 text-left transition-colors",
                preset === p.id
                  ? "border-2 border-nevo-navy bg-nevo-navy/[0.06]"
                  : "border border-nevo-near-black/12",
              )}
            >
              <span className="block text-[15px] font-semibold text-nevo-near-black">
                {p.name}
              </span>
              <span className="mt-0.5 block text-[13px] text-nevo-near-black/60">
                {p.example}
              </span>
            </button>
          ))}
        </div>

        {edited && preset === "nigerian" ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="m-0 text-[13px] text-nevo-near-black/62">
              You&rsquo;ve edited a label, so this is a custom set now.
            </p>
            <button
              type="button"
              onClick={() => applyPreset("nigerian")}
              className="cursor-pointer text-[13px] font-semibold text-nevo-navy hover:opacity-75"
            >
              Back to Nigerian
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {YEAR_GROUPS.map((yg) => (
            <div key={yg} className="flex items-center gap-3">
              <span className="w-16 flex-none font-mono text-[12px] uppercase text-nevo-near-black/45">
                {yg}
              </span>
              <input
                value={labels[yg] ?? defaultYearGroupLabel(yg)}
                onChange={(e) => {
                  const v = e.target.value;
                  setLabels((prev) => {
                    const next = { ...prev };
                    if (!v.trim() || v === defaultYearGroupLabel(yg)) delete next[yg];
                    else next[yg] = v;
                    return next;
                  });
                }}
                aria-label={`Label for ${yg}`}
                className={cn(S_FIELD, "flex-1")}
              />
            </div>
          ))}
        </div>
        <p className="m-0 mt-3 text-[12.5px] leading-[1.5] text-nevo-near-black/50">
          These labels appear on classes, student records, reports, and in the
          teacher and parent views.
        </p>

        <SaveRow phase={taxonomy} onSave={saveTaxonomy} />
      </SettingsSection>

      {/* ---------------------------------------------------------- PROMOTION */}
      <SettingsSection title="Moving everyone up a year">
        <NotBuiltNote>
          Promotion isn&rsquo;t available yet. It needs to move every year group
          up together, retire the leavers, and stay undoable for a week
          afterwards - and none of that is built on our side yet, so
          there&rsquo;s nothing here that would half-work. We&rsquo;ll tell you
          when it lands.
        </NotBuiltNote>
      </SettingsSection>

      <p className="mt-6 text-[13px] text-nevo-near-black/55">
        Something not working, or missing?{" "}
        <Link href="/admin/dashboard" className="font-semibold text-nevo-navy hover:opacity-75">
          Share feedback
        </Link>
      </p>
    </>
  );
}
