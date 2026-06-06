import { describe, expect, test } from "vitest";
import {
  findLinkTargets,
  selectTargets,
  type LinkTarget,
} from "./link-targets";

describe("findLinkTargets", () => {
  test("WikiリンクとMarkdownリンクを検出する", () => {
    const content = "See [[Wiki|alias]] and [Markdown](notes/page.md).";

    expect(findLinkTargets(content)).toEqual([
      { start: 4, end: 18, line: 0 },
      { start: 23, end: 48, line: 0 },
    ]);
  });

  test.each([
    ["https://example.com", 0, 19, 0],
    ["before https://example.com after", 7, 26, 0],
    ["before\nhttps://example.com", 7, 26, 1],
    ["(https://example.com)", 1, 20, 0],
    ["custom+scheme://example/path", 0, 28, 0],
  ])("外部URL本体の位置を返す: %s", (content, start, end, line) => {
    expect(findLinkTargets(content)).toEqual([{ start, end, line }]);
  });

  test("Markdownリンク内のURLを外部URLとして重複検出しない", () => {
    const content = "[Example](https://example.com)";

    expect(findLinkTargets(content)).toEqual([
      { start: 0, end: content.length, line: 0 },
    ]);
  });

  test("リンクがない場合は空配列を返す", () => {
    expect(findLinkTargets("plain text")).toEqual([]);
  });
});

describe("selectTargets", () => {
  const targets: LinkTarget[] = [
    { start: 5, end: 10, line: 0 },
    { start: 20, end: 25, line: 1 },
    { start: 30, end: 35, line: 0 },
  ];

  test("forwardはカーソル位置以降を開始位置の昇順で返す", () => {
    expect(selectTargets(targets, 22, 1, "forward")).toEqual([
      targets[1],
      targets[2],
    ]);
  });

  test("backwardはカーソル位置以前を開始位置の降順で返す", () => {
    expect(selectTargets(targets, 22, 1, "backward")).toEqual([
      targets[1],
      targets[0],
    ]);
  });

  test("bothは距離より同一行を優先する", () => {
    expect(selectTargets(targets, 21, 0, "both")).toEqual([
      targets[2],
      targets[0],
      targets[1],
    ]);
  });

  test("入力配列を変更しない", () => {
    const original = [...targets];

    selectTargets(targets, 22, 1, "backward");

    expect(targets).toEqual(original);
  });
});
