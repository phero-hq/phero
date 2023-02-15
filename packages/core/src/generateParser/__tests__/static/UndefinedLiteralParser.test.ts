import UndefinedLiteralParser from "../../static/UndefinedLiteralParser"

describe("UndefinedLiteralParser", () => {
  test("undefined", () => {
    expect(UndefinedLiteralParser(undefined)).toEqual({
      ok: true,
      result: undefined,
    })
  })
  test(`"undefined"`, () => {
    expect(UndefinedLiteralParser("undefined").ok).toEqual(false)
  })
  test(`null`, () => {
    expect(UndefinedLiteralParser(null).ok).toEqual(false)
  })
  test(`0`, () => {
    expect(UndefinedLiteralParser(0).ok).toEqual(false)
  })
})
