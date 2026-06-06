import { ExhaustiveError } from "./errors";
import { sorter } from "./utils/collections";
import type { RegExpMatchedArray } from "./utils/types";

export const directionList = ["forward", "both", "backward"] as const;
export type Direction = (typeof directionList)[number];

export interface LinkTarget {
  start: number;
  end: number;
  line: number;
}

function lineAt(content: string, offset: number): number {
  return content.slice(0, offset).split("\n").length - 1;
}

export function findLinkTargets(content: string): LinkTarget[] {
  const linksMatches = Array.from(
    content.matchAll(/(?<link>\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\))/g),
  ) as RegExpMatchedArray[];
  const linkTargets = linksMatches.map((match) => {
    const start = match.index;
    return {
      start,
      end: start + match.groups.link.length,
      line: lineAt(content, start),
    };
  });

  const urlsMatches = Array.from(
    content.matchAll(/(^| |\(|\n)(?<url>[a-zA-Z+-.]+:\/\/[^ )\n]+)/g),
  ) as RegExpMatchedArray[];
  const urlTargets = urlsMatches
    .map((match) => {
      const start = match.index + match[0].length - match.groups.url.length;
      return {
        start,
        end: start + match.groups.url.length,
        line: lineAt(content, start),
      };
    })
    .filter(
      (urlTarget) =>
        !linkTargets.some(
          (linkTarget) =>
            linkTarget.start <= urlTarget.start &&
            linkTarget.end >= urlTarget.end,
        ),
    );

  return [...linkTargets, ...urlTargets];
}

export function selectTargets(
  targets: LinkTarget[],
  currentOffset: number,
  cursorLine: number,
  direction: Direction,
): LinkTarget[] {
  switch (direction) {
    case "forward":
      return [...targets]
        .sort(sorter((x) => x.start))
        .filter((x) => x.end >= currentOffset);
    case "both":
      return [...targets].sort(
        sorter(
          (x) =>
            Math.min(
              Math.abs(x.start - currentOffset),
              Math.abs(x.end - currentOffset),
            ) + (x.line === cursorLine ? 0 : 10000),
        ),
      );
    case "backward":
      return [...targets]
        .sort(sorter((x) => x.start, "desc"))
        .filter((x) => x.start <= currentOffset);
    default:
      throw new ExhaustiveError(direction);
  }
}
