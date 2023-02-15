import NullLiteralParser from "../../static/NullLiteralParser"

describe("NullLiteralParser", () => {
  test("null", () => {
    expect(NullLiteralParser(null)).toEqual({
      ok: true,
      result: null,
    })
  })
  test(`"null"`, () => {
    expect(NullLiteralParser("null").ok).toEqual(false)
  })
  test(`undefined`, () => {
    expect(NullLiteralParser(undefined).ok).toEqual(false)
  })
  test(`0`, () => {
    expect(NullLiteralParser(0).ok).toEqual(false)
  })
})
