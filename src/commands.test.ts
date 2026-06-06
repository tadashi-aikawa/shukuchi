import type { Command, EditorPosition } from "obsidian";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { AppHelper } from "./app-helper";
import { createCommands } from "./commands";
import type { Settings } from "./settings";

const defaultSettings: Settings = {
  directionOfPossibleTeleportation: "both",
  delayFocusInterval: 0,
};

function positionAt(content: string, offset: number): EditorPosition {
  const before = content.slice(0, offset);
  const lines = before.split("\n");
  return {
    line: lines.length - 1,
    ch: lines[lines.length - 1]?.length ?? 0,
  };
}

function offsetAt(content: string, position: EditorPosition): number {
  const lines = content.split("\n");
  return (
    lines
      .slice(0, position.line)
      .reduce((sum, line) => sum + line.length + 1, 0) + position.ch
  );
}

function createAppHelper(content = "[[first]] and [[second]]", offset = 0) {
  let cursor = positionAt(content, offset);
  const editor = {
    getValue: vi.fn(() => content),
    getCursor: vi.fn(() => cursor),
    posToOffset: vi.fn((position: EditorPosition) =>
      offsetAt(content, position),
    ),
    offsetToPos: vi.fn((targetOffset: number) =>
      positionAt(content, targetOffset),
    ),
    setCursor: vi.fn((position: EditorPosition) => {
      cursor = position;
    }),
  };
  const cmEditor = { focus: vi.fn() };
  const helper = {
    getActiveFile: vi.fn(() => ({ path: "current.md" })),
    getActiveMarkdownView: vi.fn(() => ({ editor })),
    getActiveMarkdownEditor: vi.fn(() => editor),
    getActiveCMEditor: vi.fn(() => cmEditor),
    executeCoreCommand: vi.fn(() => true),
    splitTabGroup: vi.fn(),
    openFile: vi.fn(async () => undefined),
    getLinkFileOnCursor: vi.fn(() => ({ path: "target.md" })),
  };

  return {
    appHelper: helper as unknown as AppHelper,
    cmEditor,
    editor,
    helper,
  };
}

function getCommand(commands: Command[], id: string): Command {
  const command = commands.find((candidate) => candidate.id === id);
  if (!command) {
    throw new Error(`Command not found: ${id}`);
  }
  return command;
}

function runCheckCallback(command: Command, checking: boolean) {
  if (!command.checkCallback) {
    throw new Error(`checkCallback not found: ${command.id}`);
  }
  return command.checkCallback(checking);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createCommands", () => {
  test("公開するコマンド一覧を維持する", () => {
    const { appHelper } = createAppHelper();

    expect(createCommands(appHelper, defaultSettings).map((x) => x.id)).toEqual(
      [
        "open-link",
        "open-link-in-new-tab",
        "open-link-in-new-tabgroup",
        "open-link-in-new-tabgroup-horizontally",
        "open-link-in-new-window",
        "move-to-next-link",
        "move-to-previous-link",
      ],
    );
  });

  test.each([
    ["open-link", "editor:follow-link"],
    ["open-link-in-new-tab", "editor:open-link-in-new-leaf"],
    ["open-link-in-new-tabgroup", "editor:open-link-in-new-split"],
    ["open-link-in-new-window", "editor:open-link-in-new-window"],
  ])("%sは対応するObsidianコマンドを実行する", (id, coreCommand) => {
    const { appHelper, helper } = createAppHelper();
    const command = getCommand(createCommands(appHelper, defaultSettings), id);

    expect(runCheckCallback(command, false)).toBe(true);

    expect(helper.executeCoreCommand).toHaveBeenCalledWith(coreCommand);
  });

  test("対象リンクがカーソル外にある場合はリンク内へ移動してから開く", () => {
    const { appHelper, editor } = createAppHelper("text [[target]]", 0);
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link",
    );

    runCheckCallback(command, false);

    expect(editor.setCursor).toHaveBeenCalledWith({ line: 0, ch: 8 });
  });

  test("カーソルがリンク内にある場合は移動せずに開く", () => {
    const { appHelper, editor } = createAppHelper("[[target]]", 4);
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link",
    );

    runCheckCallback(command, false);

    expect(editor.setCursor).not.toHaveBeenCalled();
  });

  test("横分割ではリンク先ファイルを新しいタブグループで開く", () => {
    const { appHelper, helper } = createAppHelper();
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link-in-new-tabgroup-horizontally",
    );

    runCheckCallback(command, false);

    expect(helper.splitTabGroup).toHaveBeenCalledWith("horizontal");
    expect(helper.openFile).toHaveBeenCalledWith("target.md");
    expect(helper.executeCoreCommand).not.toHaveBeenCalled();
  });

  test("リンク先ファイルがない場合は横分割しない", () => {
    const { appHelper, helper } = createAppHelper();
    helper.getLinkFileOnCursor.mockReturnValue(null as never);
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link-in-new-tabgroup-horizontally",
    );

    runCheckCallback(command, false);

    expect(helper.splitTabGroup).not.toHaveBeenCalled();
    expect(helper.openFile).not.toHaveBeenCalled();
  });

  test("指定時間後に同一タブのエディタへフォーカスする", async () => {
    vi.useFakeTimers();
    const { appHelper, cmEditor } = createAppHelper();
    const command = getCommand(
      createCommands(appHelper, { ...defaultSettings, delayFocusInterval: 50 }),
      "open-link",
    );

    runCheckCallback(command, false);
    expect(cmEditor.focus).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);

    expect(cmEditor.focus).toHaveBeenCalledOnce();
  });

  test("checking時は利用可能性だけを返して副作用を起こさない", () => {
    const { appHelper, editor, helper } = createAppHelper();
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link",
    );

    expect(runCheckCallback(command, true)).toBe(true);
    expect(editor.setCursor).not.toHaveBeenCalled();
    expect(helper.executeCoreCommand).not.toHaveBeenCalled();
  });

  test("アクティブファイルがない場合は利用不可", () => {
    const { appHelper, helper } = createAppHelper();
    helper.getActiveFile.mockReturnValue(null as never);
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link",
    );

    expect(runCheckCallback(command, true)).toBeUndefined();
  });

  test("次のリンクへ移動する", () => {
    const content = "[[first]] and [[second]]";
    const { appHelper, editor } = createAppHelper(content, 4);
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "move-to-next-link",
    );

    runCheckCallback(command, false);

    expect(editor.setCursor).toHaveBeenCalledWith({ line: 0, ch: 17 });
  });

  test("前のリンクへ移動する", () => {
    const content = "[[first]] and [[second]]";
    const { appHelper, editor } = createAppHelper(content, 20);
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "move-to-previous-link",
    );

    runCheckCallback(command, false);

    expect(editor.setCursor).toHaveBeenCalledWith({ line: 0, ch: 3 });
  });

  test("対象リンクがない場合は何もしない", () => {
    const { appHelper, editor, helper } = createAppHelper("plain text");
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link",
    );

    runCheckCallback(command, false);

    expect(editor.setCursor).not.toHaveBeenCalled();
    expect(helper.executeCoreCommand).not.toHaveBeenCalled();
  });

  test("Markdownエディタがない場合は何もしない", () => {
    const { appHelper, helper } = createAppHelper();
    helper.getActiveMarkdownEditor.mockReturnValue(null as never);
    const command = getCommand(
      createCommands(appHelper, defaultSettings),
      "open-link",
    );

    runCheckCallback(command, false);

    expect(helper.executeCoreCommand).not.toHaveBeenCalled();
  });
});
