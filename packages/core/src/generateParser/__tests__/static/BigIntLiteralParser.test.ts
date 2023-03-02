import BigIntLiteralParser from "../../static/BigIntLiteralParser"

describe("BigIntLiteralParser", () => {
  test("9007199254740991n", () => {
    expect(BigIntLiteralParser(9007199254740991n)("9007199254740991")).toEqual({
      ok: true,
      result: 9007199254740991n,
    })
  })
  test(`BigInt("9007199254740991")`, () => {
    expect(
      BigIntLiteralParser(BigInt("9007199254740991"))("9007199254740991"),
    ).toEqual({
      ok: true,
      result: 9007199254740991n,
    })
  })
  test(`string`, () => {
    expect(BigIntLiteralParser(BigInt("9007199254740991"))("oops").ok).toEqual(
      false,
    )
  })
  test(`number`, () => {
    expect(BigIntLiteralParser(BigInt("9007199254740991"))(123123).ok).toEqual(
      false,
    )
  })
})
