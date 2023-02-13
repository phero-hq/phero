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
      deps: {
        ref_0: 'ObjectLiteralParser(["prop", false, NumberParser])',
      },
      output: "ref_0",
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
      deps: {
        ref_0: 'ObjectLiteralParser(["prop", false, NumberParser])',
      },
      output: "ref_0",
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
      deps: {
        ref_0: 'ObjectLiteralParser(["prop", false, NumberParser])',
      },
      output: "ref_0",
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
      deps: {
        ref_0:
          'ObjectLiteralParser(["prop", false, ref_1], ["nonGenericProp", false, BooleanParser])',
        ref_1:
          'ObjectLiteralParser(["wrap", false, NumberParser], ["nonGenericWrap", false, StringParser])',
      },
      output: "ref_0",
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
      deps: {
        ref_0:
          'ObjectLiteralParser(["embed", false, ObjectLiteralParser(["prop", false, NumberParser])])',
      },
      output: "ref_0",
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
      deps: {
        ref_0:
          'ObjectLiteralParser(["prop", false, NumberParser], ["propDef", false, StringParser])',
      },
      output: "ref_0",
    })
  })
})
