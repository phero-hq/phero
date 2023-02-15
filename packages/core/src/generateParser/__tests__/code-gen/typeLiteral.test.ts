import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("typeLiteral", () => {
  test(`{ prop: string }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop: string } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `ObjectLiteralParser(["prop", false, StringParser])`,
    )
  })
  test(`{ prop1: string, prop2: number  }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop1: string, prop2: number } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `ObjectLiteralParser(["prop1", false, StringParser], ["prop2", false, NumberParser])`,
    )
  })
  test(`{ prop?: boolean  }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop?: boolean } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `ObjectLiteralParser(["prop", true, BooleanParser])`,
    )
  })
  test(`{ prop1: string | 123, prop2?: boolean[] }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop1: string | 123, prop2?: boolean[] } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `ObjectLiteralParser(["prop1", false, UnionParser(StringParser, NumberLiteralParser(123))], ["prop2", true, ArrayParser(BooleanParser)])`,
    )
  })
  test(`{ prop1: string, prop2: { prop3: boolean, prop4: { prop5: number, prop6?: "prop6" } } }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop1: string, prop2: { prop3: boolean, prop4: { prop5: number, prop6?: "prop6" } } } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `ObjectLiteralParser(["prop1", false, StringParser], ["prop2", false, ObjectLiteralParser(["prop3", false, BooleanParser], ["prop4", false, ObjectLiteralParser(["prop5", false, NumberParser], ["prop6", true, StringLiteralParser("prop6")])])])`,
    )
  })
})
