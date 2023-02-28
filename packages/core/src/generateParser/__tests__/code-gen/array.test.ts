import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("array", () => {
  test(`string[]`, () => {
    const parsers = generateParsersForFunction(`
      function test(): string[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.String)`)
  })
  test("number[]", () => {
    const parsers = generateParsersForFunction(`
      function test(): number[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.Number)`)
  })
  test("boolean", () => {
    const parsers = generateParsersForFunction(`
      function test(): boolean[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.Boolean)`)
  })

  test(`string[][]`, () => {
    const parsers = generateParsersForFunction(`
      function test(): string[][] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.Array(parser.String))`)
  })

  test("number[][]", () => {
    const parsers = generateParsersForFunction(`
      function test(): number[][] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.Array(parser.Number))`)
  })
  test("boolean[][]", () => {
    const parsers = generateParsersForFunction(`
      function test(): boolean[][] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.Array(parser.Boolean))`)
  })
  test("Array<boolean>", () => {
    const parsers = generateParsersForFunction(`
      function test(): Array<boolean> { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.Boolean)`)
  })
  test("Array<Array<boolean>>", () => {
    const parsers = generateParsersForFunction(`
      function test(): Array<Array<boolean>> { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Array(parser.Array(parser.Boolean))`)
  })
  test("SomeGenericArray<boolean>", () => {
    const parsers = generateParsersForFunction(`
      type SomeGenericArray<T> = Array<Array<T>>
      function test(): SomeGenericArray<boolean> { throw new Error() }
    `)
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: "parser.Array(parser.Array(parser.Boolean))",
      },
    })
  })
})
