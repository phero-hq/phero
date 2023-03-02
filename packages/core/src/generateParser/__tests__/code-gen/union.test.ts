import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("union", () => {
  test(`string | number | boolean`, () => {
    const parsers = generateParsersForFunction(`
        function test(): string | number | boolean { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Union(parser.String, parser.Number, parser.Boolean)`,
    )
  })
  test(`"str" | 123 | false`, () => {
    const parsers = generateParsersForFunction(`
        function test(): "str" | 123 | false { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Union(parser.StringLiteral("str"), parser.NumberLiteral(123), parser.FalseLiteral)`,
    )
  })
  test(`(string | 123)[]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): (string | 123)[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Array(parser.Union(parser.String, parser.NumberLiteral(123)))`,
    )
  })
  test(`number[] | "yes"[]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): number[] | "yes"[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Union(parser.Array(parser.Number), parser.Array(parser.StringLiteral("yes")))`,
    )
  })
  test(`InterfaceOne | InterfaceTwo[]`, () => {
    const parsers = generateParsersForFunction(`
        interface InterfaceOne {
          prop: 1
        }
        interface InterfaceTwo {
          prop: 2
        }
        function test(): InterfaceOne | InterfaceTwo[] { throw new Error() }
    `)
    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `parser.Union(InterfaceOneParser, parser.Array(InterfaceTwoParser))`,
      deps: {
        InterfaceOneParser:
          'parser.ObjectLiteral(["prop", false, parser.NumberLiteral(1)])',
        InterfaceTwoParser:
          'parser.ObjectLiteral(["prop", false, parser.NumberLiteral(2)])',
      },
    })
  })
})
