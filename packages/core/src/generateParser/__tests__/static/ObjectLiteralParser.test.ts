import NumberKeyParser from "../../static/NumberKeyParser"
import NumberLiteralParser from "../../static/NumberLiteralParser"
import NumberParser from "../../static/NumberParser"
import ObjectLiteralParser from "../../static/ObjectLiteralParser"
import StringParser from "../../static/StringParser"
import UnionParser from "../../static/UnionParser"

describe("ObjectLiteralParser", () => {
  test("{ aap: string}", () => {
    expect(
      ObjectLiteralParser(["aap", false, StringParser])({
        aap: "aap",
      }),
    ).toEqual({
      ok: true,
      result: { aap: "aap" },
    })
  })
  test("{ aap: string, noot: number, mies: boolean }", () => {
    expect(
      ObjectLiteralParser(
        ["aap", false, StringParser],
        ["noot", false, StringParser],
        ["mies", false, StringParser],
      )({ aap: "aap", noot: "noot", mies: "mies" }),
    ).toEqual({
      ok: true,
      result: { aap: "aap", noot: "noot", mies: "mies" },
    })
  })
  test("{ aap: string, noot?: number, mies: boolean }", () => {
    expect(
      ObjectLiteralParser(
        ["aap", false, StringParser],
        ["noot", true, StringParser],
        ["mies", false, StringParser],
      )({ aap: "aap", noot: "noot", mies: "mies" }),
    ).toEqual({
      ok: true,
      result: { aap: "aap", noot: "noot", mies: "mies" },
    })
  })
  test("{ aap: string, noot?: number, mies: boolean } - missing", () => {
    expect(
      ObjectLiteralParser(
        ["aap", false, StringParser],
        ["noot", true, StringParser],
        ["mies", false, StringParser],
      )({ aap: "aap", mies: "mies" }),
    ).toEqual({
      ok: true,
      result: { aap: "aap", mies: "mies" },
    })
  })
  test("{ aap?: string, noot?: number, mies?: boolean } - empty", () => {
    expect(
      ObjectLiteralParser(
        ["aap", true, StringParser],
        ["noot", true, StringParser],
        ["mies", true, StringParser],
      )({}),
    ).toEqual({
      ok: true,
      result: {},
    })
  })
  test("{ aap?: string, noot?: number, mies?: boolean } - other data", () => {
    expect(
      ObjectLiteralParser(
        ["aap", true, StringParser],
        ["noot", true, StringParser],
        ["mies", true, StringParser],
      )({ test: true }),
    ).toEqual({
      ok: true,
      result: {},
    })
  })
  test("{ aap?: string, noot?: number, mies: { one: 1, two: 2, three: 3 } } - embeded data", () => {
    expect(
      ObjectLiteralParser(
        ["aap", true, StringParser],
        ["noot", true, StringParser],
        [
          "mies",
          false,
          ObjectLiteralParser(
            ["one", false, NumberLiteralParser(1)],
            ["two", false, NumberLiteralParser(2)],
            ["three", false, NumberLiteralParser(3)],
          ),
        ],
      )({ mies: { one: 1, two: 2, three: 3 } }),
    ).toEqual({
      ok: true,
      result: { mies: { one: 1, two: 2, three: 3 } },
    })
  })
  test("{ [aap: string]: number }", () => {
    expect(
      ObjectLiteralParser([StringParser, true, NumberParser])({ abc: 123 }),
    ).toEqual({
      ok: true,
      result: { abc: 123 },
    })
  })
  test("{ [aap: number]: string }", () => {
    expect(
      ObjectLiteralParser([NumberKeyParser, true, StringParser])({
        123: "abc",
      }),
    ).toEqual({
      ok: true,
      result: { 123: "abc" },
    })
  })
  test("{ [aap: string]: number; [aap: number]: string; aap: number | string }", () => {
    expect(
      ObjectLiteralParser(
        [StringParser, false, NumberParser],
        [NumberKeyParser, false, StringParser],
        ["aap", false, UnionParser(NumberParser, StringParser)],
      )({
        123: "abc",
        abc: 123,
        aap: 123,
      }),
    ).toEqual({
      ok: true,
      result: { 123: "abc", abc: 123, aap: 123 },
    })
  })
  test("{ [aap: string]: number; -> with number key", () => {
    expect(
      ObjectLiteralParser([StringParser, false, NumberParser])({
        123: "abc",
      }).ok,
    ).toEqual(false)
  })
  test("{ [aap: number]: string; -> with string key", () => {
    expect(
      ObjectLiteralParser([NumberKeyParser, false, StringParser])({
        abc: "abc",
      }).ok,
    ).toEqual(false)
  })
})
