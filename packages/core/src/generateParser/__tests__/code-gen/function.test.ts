import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("function", () => {
  test(`add function`, () => {
    const parsers = generateParsersForFunction(`
      function test(a: number, b: number): number { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: `ObjectLiteralParser(["a", false, NumberParser], ["b", false, NumberParser])`,
      output: `NumberParser`,
      deps: {},
    })
  })

  test(`function with generic parameters and return type`, () => {
    const parsers = generateParsersForFunction(`
      type Wrapper<T> = { t: T }
      function test(a: Wrapper<number>, b: Wrapper<string>): Wrapper<boolean> { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: 'ObjectLiteralParser(["a", false, ref_1], ["b", false, ref_2])',
      output: "ref_0",
      deps: {
        ref_0: 'ObjectLiteralParser(["t", false, BooleanParser])',
        ref_1: 'ObjectLiteralParser(["t", false, NumberParser])',
        ref_2: 'ObjectLiteralParser(["t", false, StringParser])',
      },
    })
  })
})
