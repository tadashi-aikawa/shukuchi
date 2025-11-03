import { Command, EditorPosition } from "obsidian";
import { Settings } from "./settings";
import { AppHelper } from "./app-helper";
import { sorter } from "./utils/collections";
import { ExhaustiveError } from "./errors";
import { RegExpMatchedArray } from "./utils/types";

type LeafType =
  | "same-tab"
  | "new-tab"
  | "new-tabgroup"
  | "new-tabgroup-horizontally"
  | "new-window";

export const directionList = ["forward", "both", "backward"] as const;
export type Direction = (typeof directionList)[number];

interface Position {
  start: number;
  end: number;
  line: number;
}

function createCommand(
  leaf: Exclude<LeafType, "new-tabgroup-horizontally">
): string {
  switch (leaf) {
    case "same-tab":
      return "editor:follow-link";
    case "new-tab":
      return "editor:open-link-in-new-leaf";
    case "new-tabgroup":
      return "editor:open-link-in-new-split";
    case "new-window":
      return "editor:open-link-in-new-window";
    default:
      throw new ExhaustiveError(leaf);
  }
}

function selectTargets(
  targets: Position[],
  currentOffset: number,
  cursor: EditorPosition,
  direction: Direction
): Position[] {
  switch (direction) {
    case "forward":
      return targets
        .sort(sorter((x) => x.start))
        .filter((x) => x.end >= currentOffset);
    case "both":
      return targets.sort(
        sorter(
          (x) =>
            Math.min(
              Math.abs(x.start - currentOffset),
              Math.abs(x.end - currentOffset)
            ) + (x.line === cursor.line ? 0 : 10000)
        )
      );
    case "backward":
      return targets
        .sort(sorter((x) => x.start, "desc"))
        .filter((x) => x.start <= currentOffset);
    default:
      throw new ExhaustiveError(direction);
  }
}

function findTargets(
  appHelper: AppHelper,
  option: { direction: Direction }
): Position[] {
  const editor = appHelper.getActiveMarkdownEditor();
  if (!editor) {
    return [];
  }

  const linksMatches = Array.from(
    editor.getValue().matchAll(/(?<link>\[\[[^\]]+]])/g)
  ) as RegExpMatchedArray[];
  const internalLinkPositions: Position[] = linksMatches.map((x) => ({
    start: x.index,
    end: x.index + x.groups.link.length,
    line: editor.offsetToPos(x.index + 1).line,
  }));

  const urlsMatches = Array.from(
    editor.getValue().matchAll(/(^| |\(|\n)(?<url>[a-zA-Z+-.]+:\/\/[^ )\n]+)/g)
  ) as RegExpMatchedArray[];
  const externalLinkPositions: Position[] = urlsMatches.map((x) => ({
    start: x.index,
    end: x.index + x.groups.url.length,
    line: editor.offsetToPos(x.index + 1).line,
  }));

  const cursor = editor.getCursor();
  const currentOffset = editor.posToOffset(cursor);
  return selectTargets(
    [...internalLinkPositions, ...externalLinkPositions],
    currentOffset,
    cursor,
    option.direction
  );
}

function moveToLink(
  appHelper: AppHelper,
  option: { direction: Direction }
): void {
  const editor = appHelper.getActiveMarkdownEditor();
  if (!editor) {
    return;
  }

  const cursor = editor.getCursor();
  const currentOffset = editor.posToOffset(cursor);
  const targets = findTargets(appHelper, option);
  if (targets.length === 0) {
    return;
  }

  const target =
    targets.find((x) => {
      switch (option.direction) {
        case "forward":
        case "both":
          return x.start > currentOffset;
        case "backward":
          return x.end < currentOffset;
        default:
          throw new ExhaustiveError(option.direction);
      }
    }) || targets[0];
  editor.setCursor(editor.offsetToPos(target.start + 3));
}

function openLink(
  appHelper: AppHelper,
  option: { leaf: LeafType; direction: Direction }
): void {
  const editor = appHelper.getActiveMarkdownEditor();
  if (!editor) {
    return;
  }

  const cursor = editor.getCursor();
  const currentOffset = editor.posToOffset(cursor);
  const target = findTargets(appHelper, option)?.[0];
  if (!target) {
    return;
  }

  if (currentOffset <= target.start || currentOffset > target.end) {
    editor.setCursor(editor.offsetToPos(target.start + 3));
  }

  if (option.leaf === "new-tabgroup-horizontally") {
    const f = appHelper.getLinkFileOnCursor();
    if (f) {
      appHelper.splitTabGroup("horizontal");
      // Promise
      appHelper.openFile(f.path);
    }
  } else {
    appHelper.executeCoreCommand(createCommand(option.leaf));
  }
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
    {
      id: "open-link-in-new-tabgroup",
      name: "Open link in new tab group",
      checkCallback: (checking: boolean) => {
        if (appHelper.getActiveFile() && appHelper.getActiveMarkdownView()) {
          if (!checking) {
            openLink(appHelper, {
              leaf: "new-tabgroup",
              direction: settings.directionOfPossibleTeleportation,
            });
          }
          return true;
        }
      },
    },
    {
      id: "open-link-in-new-tabgroup-horizontally",
      name: "Open link in new tab group horizontally",
      checkCallback: (checking: boolean) => {
        if (appHelper.getActiveFile() && appHelper.getActiveMarkdownView()) {
          if (!checking) {
            openLink(appHelper, {
              leaf: "new-tabgroup-horizontally",
              direction: settings.directionOfPossibleTeleportation,
            });
          }
          return true;
        }
      },
    },
    {
      id: "open-link-in-new-window",
      name: "Open link in new window",
      checkCallback: (checking: boolean) => {
        if (appHelper.getActiveFile() && appHelper.getActiveMarkdownView()) {
          if (!checking) {
            openLink(appHelper, {
              leaf: "new-window",
              direction: settings.directionOfPossibleTeleportation,
            });
          }
          return true;
        }
      },
    },
    {
      id: "move-to-next-link",
      name: "Move to next link",
      checkCallback: (checking: boolean) => {
        if (appHelper.getActiveFile() && appHelper.getActiveMarkdownView()) {
          if (!checking) {
            moveToLink(appHelper, { direction: "forward" });
          }
          return true;
        }
      },
    },
    {
      id: "move-to-previous-link",
      name: "Move to previous link",
      checkCallback: (checking: boolean) => {
        if (appHelper.getActiveFile() && appHelper.getActiveMarkdownView()) {
          if (!checking) {
            moveToLink(appHelper, { direction: "backward" });
          }
          return true;
        }
      },
    },
  ];
}
