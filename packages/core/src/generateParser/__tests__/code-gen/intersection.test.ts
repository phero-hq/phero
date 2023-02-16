import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("intersection", () => {
  test(`{ a: string} & { b: string }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { a: string} & { b: string } { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `IntersectionParser(ObjectLiteralParser(["a", false, StringParser]), ObjectLiteralParser(["b", false, StringParser]))`,
    )
  })
  test(`{ a: string} & { b?: number[] }`, () => {
    const parsers = generateParsersForFunction(`
        function test(): { a: string} & { b?: number[] } { throw new Error() }
    `)
    expect(parsers.output).toEqual(
      `IntersectionParser(ObjectLiteralParser(["a", false, StringParser]), ObjectLiteralParser(["b", true, ArrayParser(NumberParser)]))`,
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
      input: "ObjectLiteralParser()",
      output: `IntersectionParser(InterfaceOneParser, InterfaceTwoParser)`,
      deps: {
        InterfaceOneParser:
          'ObjectLiteralParser(["prop1", false, NumberParser])',
        InterfaceTwoParser:
          'ObjectLiteralParser(["prop2", false, StringParser])',
      },
    })
  })
})
