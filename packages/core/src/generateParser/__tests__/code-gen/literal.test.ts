import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("literal", () => {
  test(`"str"`, () => {
    const parsers = generateParsersForFunction(`
      function test(): "str" { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.StringLiteral("str")`)
  })
  test("123", () => {
    const parsers = generateParsersForFunction(`
      function test(): 123 { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.NumberLiteral(123)`)
  })
  test("false", () => {
    const parsers = generateParsersForFunction(`
      function test(): false { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.FalseLiteral`)
  })
  test("9007199254740991n", () => {
    const parsers = generateParsersForFunction(`
      function test(): 9007199254740991n { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.BigIntLiteral("9007199254740991")`)
  })
})
