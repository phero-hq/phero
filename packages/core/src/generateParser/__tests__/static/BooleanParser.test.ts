import BooleanParser from "../../static/BooleanParser"

describe("BooleanParser", () => {
  test("number", () => {
    expect(BooleanParser(0).ok).toEqual(false)
  })
  test("string", () => {
    expect(BooleanParser("abc").ok).toEqual(false)
  })
  test("false", () => {
    expect(BooleanParser(false)).toEqual({ ok: true, result: false })
  })
  test("true", () => {
    expect(BooleanParser(true)).toEqual({ ok: true, result: true })
  })
})
