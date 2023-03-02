import BooleanParser from "../../static/BooleanParser"
import NumberParser from "../../static/NumberParser"
import StringParser from "../../static/StringParser"
import UnionParser from "../../static/UnionParser"

describe("UnionParser", () => {
  test("string | number = string", () => {
    expect(UnionParser(StringParser, NumberParser)("abc")).toEqual({
      ok: true,
      result: "abc",
    })
  })
  test("string | number = number", () => {
    expect(UnionParser(StringParser, NumberParser)(123)).toEqual({
      ok: true,
      result: 123,
    })
  })
  test("string | number = boolean", () => {
    expect(UnionParser(StringParser, NumberParser)(true).ok).toEqual(false)
  })
  test("string | number | boolean = boolean", () => {
    expect(
      UnionParser(StringParser, NumberParser, BooleanParser)(true),
    ).toEqual({
      ok: true,
      result: true,
    })
  })
})
