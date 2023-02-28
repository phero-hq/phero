import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("generics", () => {
  test("MyInterface<number>", () => {
    const parsers = generateParsersForFunction(`
      interface MyInterface<T> {
        prop: T
      }
      function test(): MyInterface<number> { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["prop", false, parser.Number])',
      },
    })
  })
  test("MyInterface", () => {
    const parsers = generateParsersForFunction(`
      interface MyInterface<T = number> {
        prop: T
      }
      function test(): MyInterface { throw new Error() }
    `)
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["prop", false, parser.Number])',
      },
    })
  })
  test("MyTypeAlias<number>", () => {
    const parsers = generateParsersForFunction(`
      type MyTypeAlias<T> = {
        prop: T
      }
      function test(): MyTypeAlias<number> { throw new Error() }
    `)
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["prop", false, parser.Number])',
      },
    })
  })
  test("DeepGeneric<number>", () => {
    const parsers = generateParsersForFunction(`
      interface DeepGeneric<T> {
        prop: Wrap<T>
        nonGenericProp: boolean
      }
      interface Wrap<T> {
        wrap: T
        nonGenericWrap: string
      }
      function test(): DeepGeneric<number> { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0:
          'parser.ObjectLiteral(["prop", false, ref_1], ["nonGenericProp", false, parser.Boolean])',
        ref_1:
          'parser.ObjectLiteral(["wrap", false, parser.Number], ["nonGenericWrap", false, parser.String])',
      },
    })
  })
  test("EmbeddedGeneric<number>", () => {
    const parsers = generateParsersForFunction(`
      interface EmbeddedGeneric<T> {
        embed: {
          prop: T
        }
      }
      function test(): EmbeddedGeneric<number> { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0:
          'parser.ObjectLiteral(["embed", false, parser.ObjectLiteral(["prop", false, parser.Number])])',
      },
    })
  })
  test("GenericWithDefault<number>", () => {
    const parsers = generateParsersForFunction(`
      interface GenericWithDefault<T, X = string> {
        prop: T
        propDef: X
      }
      function test(): GenericWithDefault<number> { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0:
          'parser.ObjectLiteral(["prop", false, parser.Number], ["propDef", false, parser.String])',
      },
    })
  })
})
