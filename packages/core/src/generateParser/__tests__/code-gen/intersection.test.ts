import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("intersection", () => {
  test(`{ a: string} & { b: string }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { a: string} & { b: string } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Intersection(parser.ObjectLiteral(["a", false, parser.String]), parser.ObjectLiteral(["b", false, parser.String]))`,
    )
  })
  test(`{ a: string} & { b?: number[] }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { a: string} & { b?: number[] } { throw new Error() }
    `)
    expect(parsers.output).toEqual(
      `parser.Intersection(parser.ObjectLiteral(["a", false, parser.String]), parser.ObjectLiteral(["b", true, parser.Array(parser.Number)]))`,
    )
  })
  test(`InterfaceOne & InterfaceTwo`, () => {
    const parsers = generateParsersForFunction(`
        interface InterfaceOne {
          prop1: number
        }
        interface InterfaceTwo {
          prop2: string
        }
        function test(): InterfaceOne & InterfaceTwo { throw new Error() }
    `)
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `parser.Intersection(InterfaceOneParser, InterfaceTwoParser)`,
      deps: {
        InterfaceOneParser:
          'parser.ObjectLiteral(["prop1", false, parser.Number])',
        InterfaceTwoParser:
          'parser.ObjectLiteral(["prop2", false, parser.String])',
      },
    })
  })
})
