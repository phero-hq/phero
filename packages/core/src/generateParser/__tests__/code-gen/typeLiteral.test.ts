import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("typeLiteral", () => {
  test(`{ prop: string }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop: string } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.ObjectLiteral(["prop", false, parser.String])`,
    )
  })
  test(`{ prop1: string, prop2: number  }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop1: string, prop2: number } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.ObjectLiteral(["prop1", false, parser.String], ["prop2", false, parser.Number])`,
    )
  })
  test(`{ prop?: boolean  }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop?: boolean } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.ObjectLiteral(["prop", true, parser.Boolean])`,
    )
  })
  test(`{ prop1: string | 123, prop2?: boolean[] }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop1: string | 123, prop2?: boolean[] } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.ObjectLiteral(["prop1", false, parser.Union(parser.String, parser.NumberLiteral(123))], ["prop2", true, parser.Array(parser.Boolean)])`,
    )
  })
  test(`{ prop1: string, prop2: { prop3: boolean, prop4: { prop5: number, prop6?: "prop6" } } }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { prop1: string, prop2: { prop3: boolean, prop4: { prop5: number, prop6?: "prop6" } } } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.ObjectLiteral(["prop1", false, parser.String], ["prop2", false, parser.ObjectLiteral(["prop3", false, parser.Boolean], ["prop4", false, parser.ObjectLiteral(["prop5", false, parser.Number], ["prop6", true, parser.StringLiteral("prop6")])])])`,
    )
  })
})
