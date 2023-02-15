import NumberParser from "../../static/NumberParser"
import StringParser from "../../static/StringParser"
import { TupleParser } from "../../static/TupleParser"

describe("TupleParser", () => {
  describe("[string, ...number[]]", () => {
    test(`["abc"]`, () => {
      expect(
        TupleParser([StringParser], [NumberParser, true])(["abc"]),
      ).toEqual({
        ok: true,
        result: ["abc"],
      })
    })
    test(`["abc", 123]`, () => {
      expect(
        TupleParser([StringParser], [NumberParser, true])(["abc", 123]),
      ).toEqual({
        ok: true,
        result: ["abc", 123],
      })
    })
    test(`["abc", 123, 456]`, () => {
      expect(
        TupleParser([StringParser], [NumberParser, true])(["abc", 123, 456]),
      ).toEqual({
        ok: true,
        result: ["abc", 123, 456],
      })
    })
  })
  describe("[string, number, ...number[]]", () => {
    test(`["abc"]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser],
          [NumberParser, true],
        )(["abc"]).ok,
      ).toEqual(false)
    })
    test(`["abc", 123]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser],
          [NumberParser, true],
        )(["abc", 123]),
      ).toEqual({
        ok: true,
        result: ["abc", 123],
      })
    })
    test(`["abc", 123, 456]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser],
          [NumberParser, true],
        )(["abc", 123, 456]),
      ).toEqual({
        ok: true,
        result: ["abc", 123, 456],
      })
    })
  })
  describe("[string, ...number[], number]", () => {
    test(`["abc"]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser, true],
          [NumberParser],
        )(["abc"]).ok,
      ).toEqual(false)
    })
    test(`["abc", 123]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser, true],
          [NumberParser],
        )(["abc", 123]),
      ).toEqual({
        ok: true,
        result: ["abc", 123],
      })
    })
    test(`["abc", 123, 456]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser, true],
          [NumberParser],
        )(["abc", 123, 456]),
      ).toEqual({
        ok: true,
        result: ["abc", 123, 456],
      })
    })
  })
  describe("[string, number, ...string[], string, number]", () => {
    test(`["abc", 1, "def" , 2]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser],
          [StringParser, true],
          [StringParser],
          [NumberParser],
        )(["abc", 1, "def", 2]),
      ).toEqual({
        ok: true,
        result: ["abc", 1, "def", 2],
      })
    })
    test(`["abc", 1, "def", "ghi", 2]`, () => {
      expect(
        TupleParser(
          [StringParser],
          [NumberParser],
          [StringParser, true],
          [StringParser],
          [NumberParser],
        )(["abc", 1, "def", "ghi", 2]),
      ).toEqual({
        ok: true,
        result: ["abc", 1, "def", "ghi", 2],
      })
    })
  })
})
