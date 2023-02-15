import StringLiteralParser from "../../static/StringLiteralParser"

describe("StringLiteralParser", () => {
  test("string", () => {
    expect(StringLiteralParser("abc")("abc")).toEqual({
      ok: true,
      result: "abc",
    })
  })
  test("empty string", () => {
    expect(StringLiteralParser("")("")).toEqual({
      ok: true,
      result: "",
    })
  })
  test("number", () => {
    expect(StringLiteralParser("123")(123).ok).toEqual(false)
  })
})
