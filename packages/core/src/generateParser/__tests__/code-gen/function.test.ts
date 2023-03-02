import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("function", () => {
  test(`add function`, () => {
    const parsers = generateParsersForFunction(`
      function test(a: number, b: number): number { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: `parser.ObjectLiteral(["a", false, parser.Number], ["b", false, parser.Number])`,
      output: `parser.Number`,
      deps: {},
    })
  })

  test(`function with generic parameters and return type`, () => {
    const parsers = generateParsersForFunction(`
      type Wrapper<T> = { t: T }
      function test(a: Wrapper<number>, b: Wrapper<string>): Wrapper<boolean> { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: 'parser.ObjectLiteral(["a", false, ref_1], ["b", false, ref_2])',
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["t", false, parser.Boolean])',
        ref_1: 'parser.ObjectLiteral(["t", false, parser.Number])',
        ref_2: 'parser.ObjectLiteral(["t", false, parser.String])',
      },
    })
  })
})
