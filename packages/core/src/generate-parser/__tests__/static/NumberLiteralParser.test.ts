import NumberLiteralParser from "../../static/NumberLiteralParser"

describe("NumberLiteralParser", () => {
  test("123", () => {
    expect(NumberLiteralParser(123)(123)).toEqual({
      ok: true,
      result: 123,
    })
  })
  test("124", () => {
    expect(NumberLiteralParser(123)(124).ok).toEqual(false)
  })
})
