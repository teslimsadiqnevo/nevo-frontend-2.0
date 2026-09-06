import { describe, expect, it } from "vitest";
import { SAMPLE_ATTR, sampleMark, sampleRegions } from "./sampleData";

/**
 * The mark that makes end-to-end testing honest here.
 *
 * The whole E2E strategy rests on one assertion - "no sample region is on the
 * page once signed in" - so the detector itself has to be right. A
 * `sampleRegions()` that silently returned nothing would make every future E2E
 * pass while the console showed fixture children to a real teacher, which is
 * precisely the failure it was built to catch.
 */

describe("the sample mark", () => {
  it("names the surface, so a failure says WHICH screen fell back", () => {
    expect(sampleMark("teacher:class-detail")).toEqual({
      [SAMPLE_ATTR]: "teacher:class-detail",
    });
  });

  it("finds every marked region, and reports what each one was", () => {
    document.body.innerHTML = `
      <main>
        <div ${SAMPLE_ATTR}="teacher:class-detail"><p>sample</p></div>
        <div><p>real</p></div>
        <section ${SAMPLE_ATTR}="teacher:lesson-detail"></section>
      </main>`;
    expect(sampleRegions()).toEqual([
      "teacher:class-detail",
      "teacher:lesson-detail",
    ]);
  });

  it("finds a mark nested deep inside real content", () => {
    // The fallback is decided per surface, not per page, so a marked region
    // can sit anywhere in the tree. A shallow check would miss it and report
    // a clean page.
    document.body.innerHTML = `
      <main><div><section><article
        ${SAMPLE_ATTR}="teacher:student-profile"></article></section></div></main>`;
    expect(sampleRegions()).toEqual(["teacher:student-profile"]);
  });

  it("reports nothing on a page with no samples", () => {
    document.body.innerHTML = `<main><p>a real roster</p></main>`;
    expect(sampleRegions()).toEqual([]);
  });

  it("can be scoped to part of the page", () => {
    document.body.innerHTML = `
      <main id="a"><div ${SAMPLE_ATTR}="one"></div></main>
      <aside id="b"><div ${SAMPLE_ATTR}="two"></div></aside>`;
    const aside = document.getElementById("b")!;
    expect(sampleRegions(aside)).toEqual(["two"]);
  });
});
