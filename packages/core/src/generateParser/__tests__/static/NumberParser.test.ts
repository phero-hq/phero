import NumberParser from "../../static/NumberParser"

describe("NumberParser", () => {
  test("123", () => {
    expect(NumberParser(123)).toEqual({
      ok: true,
      result: 123,
    })
  })
  test("-123", () => {
    expect(NumberParser(-123)).toEqual({
      ok: true,
      result: -123,
    })
  })
  test("-0", () => {
    expect(NumberParser(-0)).toEqual({
      ok: true,
      result: -0,
    })
  })
  test("string", () => {
    expect(NumberParser("123").ok).toEqual(false)
  })
  test("boolean", () => {
    expect(NumberParser(true).ok).toEqual(false)
  })
})
