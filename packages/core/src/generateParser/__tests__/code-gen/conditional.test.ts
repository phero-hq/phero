import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("conditional", () => {
  test("MyConditionalType<number>", () => {
    const parsers = generateParsersForFunction(`
      type MyConditionalType<T> = T extends string ? {
        prop: number
      } : {
        prop: string
      }
      function test(): MyConditionalType<number> { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        ref_0: 'ObjectLiteralParser(["prop", false, StringParser])',
      },
      output: "ref_0",
    })
  })
  test("MyConditionalType<string>", () => {
    const parsers = generateParsersForFunction(`
      type MyConditionalType<T> = T extends string ? {
        prop: number
      } : {
        prop: string
      }
      function test(): MyConditionalType<string> { throw new Error() }
    `)
    expect(parsers).toEqual({
      deps: {
        ref_0: 'ObjectLiteralParser(["prop", false, NumberParser])',
      },
      output: "ref_0",
    })
  })
  test("MyDeepConditionalType<number>", () => {
    const parsers = generateParsersForFunction(`
      type MyDeepConditionalType<T> = {
        t: T
        deep: DeepCondition<string>
      }

      type DeepCondition<T> = T extends string ? {
        prop: number
      } : {
        prop: string
      }

      function test(): MyDeepConditionalType<number> { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        ref_0:
          'ObjectLiteralParser(["t", false, NumberParser], ["deep", false, ref_1])',
        ref_1: 'ObjectLiteralParser(["prop", false, NumberParser])',
      },
      output: "ref_0",
    })
  })
  test("MyDeepConditionalType<number>", () => {
    const parsers = generateParsersForFunction(`
      type MyDeepConditionalType<T> = {
        deep: DeepCondition<T>
      }

      type DeepCondition<T> = T extends string ? {
        prop: number
      } : {
        prop: string
      }

      function test(): MyDeepConditionalType<number> { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        ref_0: 'ObjectLiteralParser(["deep", false, ref_1])',
        ref_1: 'ObjectLiteralParser(["prop", false, StringParser])',
      },
      output: "ref_0",
    })
  })
  test("MyType<number>", () => {
    const parsers = generateParsersForFunction(`
      interface MyType<T> {
        prop: Wrap<T>
      }
      interface Wrap<W> {
        inner: W
      }
      function test(): MyType<number> { throw new Error() }
    `)
    expect(parsers).toEqual({
      deps: {
        ref_0: 'ObjectLiteralParser(["prop", false, ref_1])',
        ref_1: 'ObjectLiteralParser(["inner", false, NumberParser])',
      },
      output: "ref_0",
    })
  })

  test("MyDeepConditionalRecursiveType<number>", () => {
    const parsers = generateParsersForFunction(`
      interface MyDeepConditionalRecursiveType<T> {
        prop: Wrap<T>
      }
      interface Wrap<W, B = W extends string ? number : boolean> {
        w: W
        b: B
        recursive?: MyDeepConditionalRecursiveType<{ b: B }>
      }
      function test(): MyDeepConditionalRecursiveType<number> { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        ref_0: 'ObjectLiteralParser(["prop", false, ref_1])',
        ref_1:
          'ObjectLiteralParser(["w", false, NumberParser], ["b", false, BooleanParser], ["recursive", true, ref_2])',
        ref_2: 'ObjectLiteralParser(["prop", false, ref_3])',
        ref_3:
          'ObjectLiteralParser(["w", false, ObjectLiteralParser(["b", false, BooleanParser])], ["b", false, BooleanParser], ["recursive", true, ref_2])',
      },
      output: "ref_0",
    })
  })
  test("MyConditionalType<number>", () => {
    const parsers = generateParsersForFunction(`
      type MyConditionalType<T, K> = T extends string ? {
        prop: number
        x: K
      } : {
        prop: string
        x: K
      }
      interface Hop<H> {
        h: H
      }
      function test(): MyConditionalType<number, Hop<number>> { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        ref_0: 'ObjectLiteralParser(["h", false, NumberParser])',
        ref_1:
          'ObjectLiteralParser(["prop", false, StringParser], ["x", false, ref_0])',
      },
      output: "ref_1",
    })
  })
})
