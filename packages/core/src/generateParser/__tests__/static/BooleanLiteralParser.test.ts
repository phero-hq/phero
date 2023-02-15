import {
  FalseLiteralParser,
  TrueLiteralParser,
} from "../../static/BooleanLiteralParser"

describe("BooleanLiteralParser", () => {
  describe("TrueLiteralParser", () => {
    test("number", () => {
      expect(TrueLiteralParser(0).ok).toEqual(false)
    })
    test("string", () => {
      expect(TrueLiteralParser("abc").ok).toEqual(false)
    })
    test("false", () => {
      expect(TrueLiteralParser(false).ok).toEqual(false)
    })
    test("true", () => {
      expect(TrueLiteralParser(true)).toEqual({ ok: true, result: true })
    })
  })
  describe("FalseLiteralParser", () => {
    test("number", () => {
      expect(FalseLiteralParser(0).ok).toEqual(false)
    })
    test("string", () => {
      expect(FalseLiteralParser("abc").ok).toEqual(false)
    })
    test("true", () => {
      expect(FalseLiteralParser(true).ok).toEqual(false)
    })
    test("false", () => {
      expect(FalseLiteralParser(false)).toEqual({ ok: true, result: false })
    })
  })
})
