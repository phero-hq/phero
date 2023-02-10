import { generateParsersForFunction } from "../../lib/tsTestUtils"

describe("literal", () => {
  test(`"str"`, () => {
    const parsers = generateParsersForFunction(`
      function test(): "str" { throw new Error() }
    `)

    expect(parsers.output).toEqual(`StringLiteralParser("str")`)
  })
  test("123", () => {
    const parsers = generateParsersForFunction(`
      function test(): 123 { throw new Error() }
    `)

    expect(parsers.output).toEqual(`NumberLiteralParser(123)`)
  })
  test("false", () => {
    const parsers = generateParsersForFunction(`
      function test(): false { throw new Error() }
    `)

    expect(parsers.output).toEqual(`BooleanLiteralParser(false)`)
  })
  test("9007199254740991n", () => {
    const parsers = generateParsersForFunction(`
      function test(): 9007199254740991n { throw new Error() }
    `)

    expect(parsers.output).toEqual(`BigIntLiteralParser("9007199254740991")`)
  })
})
