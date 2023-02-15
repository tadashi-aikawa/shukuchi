import { Command, EditorPosition } from "obsidian";
import { Settings } from "./settings";
import { AppHelper } from "./app-helper";
import { sorter } from "./utils/collections";
import { ExhaustiveError } from "./errors";
import { RegExpMatchedArray } from "./utils/types";

type LeafType = "same-tab" | "new-tab";

export const directionList = ["forward", "both"] as const;
export type Direction = (typeof directionList)[number];

interface Position {
  start: number;
  end: number;
  line: number;
}

function createCommand(leaf: LeafType): string {
  switch (leaf) {
    case "same-tab":
      return "editor:follow-link";
    case "new-tab":
      return "editor:open-link-in-new-leaf";
    default:
      throw new ExhaustiveError(leaf);
  }
}

function selectTarget(
  targets: Position[],
  currentOffset: number,
  cursor: EditorPosition,
  direction: Direction
): Position | undefined {
  switch (direction) {
    case "forward":
      return targets
        .sort(sorter((x) => x.start))
        .find((x) => x.end >= currentOffset);
    case "both":
      return targets.sort(
        sorter(
          (x) =>
            Math.min(
              Math.abs(x.start - currentOffset),
              Math.abs(x.end - currentOffset)
            ) + (x.line === cursor.line ? 0 : 10000)
        )
      )?.[0];
    default:
      throw new ExhaustiveError(direction);
  }
}

function openLink(
  appHelper: AppHelper,
  option: { leaf: LeafType; direction: Direction }
): void {
  const editor = appHelper.getActiveMarkdownEditor();
  if (!editor) {
    return;
  }

  const linksMatches = Array.from(
    editor.getValue().matchAll(/(?<link>\[\[[^\]]+]])/g)
  ) as RegExpMatchedArray[];
  const internalLinkPositions: Position[] = linksMatches.map((x) => ({
    start: x.index,
    end: x.index + x.groups.link.length,
    line: editor.offsetToPos(x.index).line,
  }));

  const urlsMatches = Array.from(
    editor.getValue().matchAll(/(?<= |\n|^|\()(?<url>https?:\/\/[^ )\n]+)/g)
  ) as RegExpMatchedArray[];
  const externalLinkPositions: Position[] = urlsMatches.map((x) => ({
    start: x.index,
    end: x.index + x.groups.url.length,
    line: editor.offsetToPos(x.index).line,
  }));

  const cursor = editor.getCursor();
  const currentOffset = editor.posToOffset(cursor);
  const target = selectTarget(
    [...internalLinkPositions, ...externalLinkPositions],
    currentOffset,
    cursor,
    option.direction
  );
  if (!target) {
    return;
  }

  if (currentOffset <= target.start || currentOffset > target.end) {
    editor.setCursor(editor.offsetToPos(target.start + 1));
  }

  appHelper.executeCoreCommand(createCommand(option.leaf));
}

export function createCommands(
  appHelper: AppHelper,
  settings: Settings
): Command[] {
  return [
    {
      id: "open-link",
      name: "Open link",
      checkCallback: (checking: boolean) => {
        if (appHelper.getActiveFile() && appHelper.getActiveMarkdownView()) {
          if (!checking) {
            openLink(appHelper, {
              leaf: "same-tab",
              direction: settings.directionOfPossibleTeleportation,
            });
          }
          return true;
        }
      },
    },
    {
      id: "open-link-in-new-tab",
      name: "Open link in new tab",
      checkCallback: (checking: boolean) => {
        if (appHelper.getActiveFile() && appHelper.getActiveMarkdownView()) {
          if (!checking) {
            openLink(appHelper, {
              leaf: "new-tab",
              direction: settings.directionOfPossibleTeleportation,
            });
          }
          return true;
        }
      },
    },
  ];
}
