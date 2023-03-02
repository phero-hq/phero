import BooleanParser from "../../static/BooleanParser"
import IntersectionParser from "../../static/IntersectionParser"
import NumberParser from "../../static/NumberParser"
import ObjectLiteralParser from "../../static/ObjectLiteralParser"
import StringParser from "../../static/StringParser"

describe("IntersectionParser", () => {
  test("{ a: string} & { b: number }", () => {
    expect(
      IntersectionParser(
        ObjectLiteralParser(["a", false, StringParser]),
        ObjectLiteralParser(["b", false, NumberParser]),
      )({ a: "abc", b: 123 }),
    ).toEqual({
      ok: true,
      result: { a: "abc", b: 123 },
    })
  })
  test("{ a: string} & { b: number } & { c?: boolean }", () => {
    expect(
      IntersectionParser(
        ObjectLiteralParser(["a", false, StringParser]),
        ObjectLiteralParser(["b", false, NumberParser]),
        ObjectLiteralParser(["c", true, BooleanParser]),
      )({ a: "abc", b: 123 }),
    ).toEqual({
      ok: true,
      result: { a: "abc", b: 123 },
    })
  })
  test("{ a: string} & { b: number } & { c?: boolean }", () => {
    expect(
      IntersectionParser(
        ObjectLiteralParser(["a", false, StringParser]),
        ObjectLiteralParser(["b", false, NumberParser]),
        ObjectLiteralParser(["c", true, BooleanParser]),
      )({ a: "abc", b: 123, c: false }),
    ).toEqual({
      ok: true,
      result: { a: "abc", b: 123, c: false },
    })
  })
  test("{ a: string} & { b: number } & { c?: boolean } -- no b", () => {
    expect(
      IntersectionParser(
        ObjectLiteralParser(["a", false, StringParser]),
        ObjectLiteralParser(["b", false, NumberParser]),
        ObjectLiteralParser(["c", true, BooleanParser]),
      )({ a: "abc", c: false }).ok,
    ).toEqual(false)
  })
  test("{ a: string} & { b: number } & { c?: boolean } -- no a", () => {
    expect(
      IntersectionParser(
        ObjectLiteralParser(["a", false, StringParser]),
        ObjectLiteralParser(["b", false, NumberParser]),
        ObjectLiteralParser(["c", true, BooleanParser]),
      )({ b: 123, c: false }).ok,
    ).toEqual(false)
  })
  test("{ a: string} & { b: number } & { c?: boolean } -- no a and b", () => {
    expect(
      IntersectionParser(
        ObjectLiteralParser(["a", false, StringParser]),
        ObjectLiteralParser(["b", false, NumberParser]),
        ObjectLiteralParser(["c", true, BooleanParser]),
      )({ c: false }).ok,
    ).toEqual(false)
  })
})
