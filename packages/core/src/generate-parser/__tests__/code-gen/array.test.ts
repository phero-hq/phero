import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("array", () => {
  test(`string[]`, () => {
    const parsers = generateParsersForFunction(`
      function test(): string[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(StringParser)`)
  })
  test("number[]", () => {
    const parsers = generateParsersForFunction(`
      function test(): number[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(NumberParser)`)
  })
  test("boolean", () => {
    const parsers = generateParsersForFunction(`
      function test(): boolean[] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(BooleanParser)`)
  })

  test(`string[][]`, () => {
    const parsers = generateParsersForFunction(`
      function test(): string[][] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(ArrayParser(StringParser))`)
  })

  test("number[][]", () => {
    const parsers = generateParsersForFunction(`
      function test(): number[][] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(ArrayParser(NumberParser))`)
  })
  test("boolean[][]", () => {
    const parsers = generateParsersForFunction(`
      function test(): boolean[][] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(ArrayParser(BooleanParser))`)
  })
  test("Array<boolean>", () => {
    const parsers = generateParsersForFunction(`
      function test(): Array<boolean> { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(BooleanParser)`)
  })
  test("Array<Array<boolean>>", () => {
    const parsers = generateParsersForFunction(`
      function test(): Array<Array<boolean>> { throw new Error() }
    `)

    expect(parsers.output).toEqual(`ArrayParser(ArrayParser(BooleanParser))`)
  })
  test("SomeGenericArray<boolean>", () => {
    const parsers = generateParsersForFunction(`
      type SomeGenericArray<T> = Array<Array<T>>
      function test(): SomeGenericArray<boolean> { throw new Error() }
    `)
    expect(parsers).toEqual({
      output: "ref_0",
      deps: {
        ref_0: "ArrayParser(ArrayParser(BooleanParser))",
      },
    })
  })
})
