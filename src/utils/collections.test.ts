import { describe, expect, test } from "vitest";
import { mirror, mirrorMap, sorter } from "./collections";

describe("sorter", () => {
  const values = [{ value: 3 }, { value: 1 }, { value: 2 }];

  test("昇順で並べる", () => {
    expect([...values].sort(sorter((x) => x.value))).toEqual([
      { value: 1 },
      { value: 2 },
      { value: 3 },
    ]);
  });

  test("降順で並べる", () => {
    expect([...values].sort(sorter((x) => x.value, "desc"))).toEqual([
      { value: 3 },
      { value: 2 },
      { value: 1 },
    ]);
  });
});

describe("mirrorMap", () => {
  test("変換結果をキーと値に持つオブジェクトを返す", () => {
    expect(mirrorMap([{ id: "a" }, { id: "b" }], (x) => x.id)).toEqual({
      a: "a",
      b: "b",
    });
  });
});

describe("mirror", () => {
  test("各文字列をキーと値に持つオブジェクトを返す", () => {
    expect(mirror(["forward", "backward"])).toEqual({
      forward: "forward",
      backward: "backward",
    });
  });
});
