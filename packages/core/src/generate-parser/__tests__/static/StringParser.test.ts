import StringParser from "../../static/StringParser"

describe("StringParser", () => {
  test("string", () => {
    expect(StringParser("abc")).toEqual({
      ok: true,
      result: "abc",
    })
  })
  test("empty string", () => {
    expect(StringParser("")).toEqual({
      ok: true,
      result: "",
    })
  })
  test("number", () => {
    expect(StringParser(123).ok).toEqual(false)
  })
})
