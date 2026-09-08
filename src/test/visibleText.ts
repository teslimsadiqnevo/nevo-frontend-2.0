/**
 * The rendered text of a subtree, with element boundaries preserved as spaces.
 *
 * `container.textContent` runs neighbouring elements straight together -
 * "Roster sync" followed by "Healthy" reads as `syncHealthy` - and that breaks
 * assertions in the direction that hides bugs: `/\bHealthy\b/` cannot match it,
 * so `expect(...).not.toMatch(/\bHealthy\b/)` passes on a screen that is
 * shouting the word. An assertion that cannot fail is worse than no assertion,
 * because it is counted as coverage.
 *
 * Curly quotes are folded to ASCII so a test can be written in characters a
 * keyboard produces, and whitespace is collapsed so JSX line breaks don't leak
 * into the string.
 */
export function visibleText(root: HTMLElement): string {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) parts.push(walker.currentNode.textContent ?? "");
  return parts
    .join(" ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
