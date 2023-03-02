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
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["prop", false, parser.String])',
      },
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
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["prop", false, parser.Number])',
      },
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
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0:
          'parser.ObjectLiteral(["t", false, parser.Number], ["deep", false, ref_1])',
        ref_1: 'parser.ObjectLiteral(["prop", false, parser.Number])',
      },
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
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["deep", false, ref_1])',
        ref_1: 'parser.ObjectLiteral(["prop", false, parser.String])',
      },
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
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["prop", false, ref_1])',
        ref_1: 'parser.ObjectLiteral(["inner", false, parser.Number])',
      },
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
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.ObjectLiteral(["prop", false, ref_1])',
        ref_1:
          'parser.ObjectLiteral(["w", false, parser.Number], ["b", false, parser.Boolean], ["recursive", true, ref_2])',
        ref_2: 'parser.ObjectLiteral(["prop", false, ref_3])',
        ref_3:
          'parser.ObjectLiteral(["w", false, parser.ObjectLiteral(["b", false, parser.Boolean])], ["b", false, parser.Boolean], ["recursive", true, ref_2])',
      },
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
      input: "parser.ObjectLiteral()",
      output: "ref_1",
      deps: {
        ref_0: 'parser.ObjectLiteral(["h", false, parser.Number])',
        ref_1:
          'parser.ObjectLiteral(["prop", false, parser.String], ["x", false, ref_0])',
      },
    })
  })
})
