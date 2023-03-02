import AnyParser from "../../static/AnyParser"

describe("AnyParser", () => {
  test("string", () => {
    expect(AnyParser("string")).toEqual({ ok: true, result: "string" })
  })
  test("number", () => {
    expect(AnyParser(123)).toEqual({ ok: true, result: 123 })
  })
  test("boolean", () => {
    expect(AnyParser(true)).toEqual({ ok: true, result: true })
  })
  test("[{ a: 123 }]", () => {
    expect(AnyParser([{ a: 123 }])).toEqual({ ok: true, result: [{ a: 123 }] })
  })
})
