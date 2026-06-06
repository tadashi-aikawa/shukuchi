import type { Command } from "obsidian";
import type { Settings } from "./settings";
import type { AppHelper } from "./app-helper";
import { ExhaustiveError } from "./errors";
import {
  directionList,
  findLinkTargets,
  selectTargets,
  type Direction,
} from "./link-targets";

export { directionList };
export type { Direction };

type LeafType =
  | "same-tab"
  | "new-tab"
  | "new-tabgroup"
  | "new-tabgroup-horizontally"
  | "new-window";

function createCommand(
  leaf: Exclude<LeafType, "new-tabgroup-horizontally">,
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

function findTargets(appHelper: AppHelper, option: { direction: Direction }) {
  const editor = appHelper.getActiveMarkdownEditor();
  if (!editor) {
    return [];
  }

  const cursor = editor.getCursor();
  const currentOffset = editor.posToOffset(cursor);
  return selectTargets(
    findLinkTargets(editor.getValue()),
    currentOffset,
    cursor.line,
    option.direction,
  );
}

function moveToLink(
  appHelper: AppHelper,
  option: { direction: Direction },
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

async function openLink(
  appHelper: AppHelper,
  option: { leaf: LeafType; direction: Direction; delayFocusInterval: number },
): Promise<void> {
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

  if (option.leaf === "same-tab" && option.delayFocusInterval > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, option.delayFocusInterval),
    );
    appHelper.getActiveCMEditor()?.focus();
  }
}

const openCommandDefinitions: {
  id: string;
  name: string;
  leaf: LeafType;
}[] = [
  { id: "open-link", name: "Open link", leaf: "same-tab" },
  {
    id: "open-link-in-new-tab",
    name: "Open link in new tab",
    leaf: "new-tab",
  },
  {
    id: "open-link-in-new-tabgroup",
    name: "Open link in new tab group",
    leaf: "new-tabgroup",
  },
  {
    id: "open-link-in-new-tabgroup-horizontally",
    name: "Open link in new tab group horizontally",
    leaf: "new-tabgroup-horizontally",
  },
  {
    id: "open-link-in-new-window",
    name: "Open link in new window",
    leaf: "new-window",
  },
];

function isCommandAvailable(appHelper: AppHelper): boolean {
  return Boolean(
    appHelper.getActiveFile() && appHelper.getActiveMarkdownView(),
  );
}

export function createCommands(
  appHelper: AppHelper,
  settings: Settings,
): Command[] {
  return [
    ...openCommandDefinitions.map(({ id, name, leaf }) => ({
      id,
      name,
      checkCallback: (checking: boolean) => {
        if (!isCommandAvailable(appHelper)) {
          return;
        }
        if (!checking) {
          void openLink(appHelper, {
            leaf,
            direction: settings.directionOfPossibleTeleportation,
            delayFocusInterval: settings.delayFocusInterval,
          });
        }
        return true;
      },
    })),
    {
      id: "move-to-next-link",
      name: "Move to next link",
      checkCallback: (checking: boolean) => {
        if (!isCommandAvailable(appHelper)) {
          return;
        }
        if (!checking) {
          moveToLink(appHelper, { direction: "forward" });
        }
        return true;
      },
    },
    {
      id: "move-to-previous-link",
      name: "Move to previous link",
      checkCallback: (checking: boolean) => {
        if (!isCommandAvailable(appHelper)) {
          return;
        }
        if (!checking) {
          moveToLink(appHelper, { direction: "backward" });
        }
        return true;
      },
    },
  ];
}
