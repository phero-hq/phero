import BigIntParser from "../../static/BigIntParser"

describe("BigIntParser", () => {
  test("9007199254740991n", () => {
    expect(BigIntParser("9007199254740991")).toEqual({
      ok: true,
      result: 9007199254740991n,
    })
  })
  test(`BigInt("9007199254740991")`, () => {
    expect(BigIntParser("9007199254740991")).toEqual({
      ok: true,
      result: 9007199254740991n,
    })
  })
  test(`string`, () => {
    expect(BigIntParser("oops").ok).toEqual(false)
  })
  test(`number`, () => {
    expect(BigIntParser(123123).ok).toEqual(false)
  })
})
