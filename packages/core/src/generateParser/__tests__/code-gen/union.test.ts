import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("union", () => {
  test(`string | number | boolean`, () => {
    const parsers = generateParsersForFunction(`
        function test(): string | number | boolean { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `UnionParser(StringParser, NumberParser, BooleanParser)`,
    )
  })
  test(`"str" | 123 | false`, () => {
    const parsers = generateParsersForFunction(`
        function test(): "str" | 123 | false { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `UnionParser(StringLiteralParser("str"), NumberLiteralParser(123), BooleanLiteralParser(false))`,
    )
  })
  test(`(string | 123)[]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): (string | 123)[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `ArrayParser(UnionParser(StringParser, NumberLiteralParser(123)))`,
    )
  })
  test(`number[] | "yes"[]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): number[] | "yes"[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `UnionParser(ArrayParser(NumberParser), ArrayParser(StringLiteralParser("yes")))`,
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
      input: "ObjectLiteralParser()",
      output: `UnionParser(InterfaceOneParser, ArrayParser(InterfaceTwoParser))`,
      deps: {
        InterfaceOneParser:
          'ObjectLiteralParser(["prop", false, NumberLiteralParser(1)])',
        InterfaceTwoParser:
          'ObjectLiteralParser(["prop", false, NumberLiteralParser(2)])',
      },
    })
  })
})
