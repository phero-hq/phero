import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("conditional", () => {
  test("MyConditionalType<number>", () => {
    const modelMap = generateParserModelMap(`
      type MyConditionalType<T> = T extends string ? {
        prop: number
      } : {
        prop: string
      }
      function test(): MyConditionalType<number> { throw new Error() }
    `)
    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyConditionalType<number>",
      },
      deps: {
        "MyConditionalType<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
      },
    })
  })
  test("MyConditionalType<string>", () => {
    const modelMap = generateParserModelMap(`
      type MyConditionalType<T> = T extends string ? {
        prop: number
      } : {
        prop: string
      }
      function test(): MyConditionalType<string> { throw new Error() }
    `)
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyConditionalType<string>",
      },
      deps: {
        "MyConditionalType<string>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test("MyDeepConditionalType<number>", () => {
    const modelMap = generateParserModelMap(`
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
    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyDeepConditionalType<number>",
      },
      deps: {
        "MyDeepConditionalType<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "t",
              optional: false,
              parser: {
                type: "number",
              },
            },
            {
              type: "member",
              name: "deep",
              optional: false,
              parser: {
                type: "reference",
                typeName: "DeepCondition<string>",
              },
            },
          ],
        },
        "DeepCondition<string>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test("MyDeepConditionalType<number>", () => {
    const modelMap = generateParserModelMap(`
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
    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyDeepConditionalType<number>",
      },
      deps: {
        "MyDeepConditionalType<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "deep",
              optional: false,
              parser: {
                type: "reference",
                typeName: "DeepCondition<number>",
              },
            },
          ],
        },
        "DeepCondition<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
      },
    })
  })
  test("MyType<number>", () => {
    const modelMap = generateParserModelMap(`
      interface MyType<T> {
        prop: Wrap<T>
      }
      interface Wrap<W> {
        inner: W
      }
      function test(): MyType<number> { throw new Error() }
    `)
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyType<number>",
      },
      deps: {
        "MyType<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "reference",
                typeName: "Wrap<number>",
              },
            },
          ],
        },
        "Wrap<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "inner",
              optional: false,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })

  test.only("MyDeepConditionalRecursiveType<number>", () => {
    const modelMap = generateParserModelMap(`
      interface MyDeepConditionalRecursiveType<T> {
        prop: Wrap<T>
      }
      interface Wrap<W, B = W extends string ? number : boolean> {
        w: W
        b: B
        recursive?: MyDeepConditionalRecursiveType<B>
      }
      function test(): MyDeepConditionalRecursiveType<number> { throw new Error() }
    `)
    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyDeepConditionalRecursiveType<number>",
      },
      deps: {
        "MyDeepConditionalRecursiveType<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "reference",
                typeName: "Wrap<number, boolean>",
              },
            },
          ],
        },
        "Wrap<number, boolean>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "w",
              optional: false,
              parser: {
                type: "number",
              },
            },
            {
              type: "member",
              name: "b",
              optional: false,
              parser: {
                type: "boolean",
              },
            },
            {
              type: "member",
              name: "recursive",
              optional: true,
              parser: {
                type: "reference",
                typeName: "MyDeepConditionalRecursiveType<boolean>",
              },
            },
          ],
        },
        "MyDeepConditionalRecursiveType<boolean>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "reference",
                typeName: "Wrap<boolean, boolean>",
              },
            },
          ],
        },
        "Wrap<boolean, boolean>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "w",
              optional: false,
              parser: {
                type: "boolean",
              },
            },
            {
              type: "member",
              name: "b",
              optional: false,
              parser: {
                type: "boolean",
              },
            },
            {
              type: "member",
              name: "recursive",
              optional: true,
              parser: {
                type: "reference",
                typeName: "MyDeepConditionalRecursiveType<boolean>",
              },
            },
          ],
        },
      },
    })
  })
})

// MET JASPER:
// // MyDeepConditionalRecursiveType<number>

// const MyDeepConditionalRecursiveType_number_Parser = {
//   prop: Wrap_number_boolean_Parser
// }

// const Wrap_number_boolean_Parser = {
//   w: NumberParser,
//   b: BooleanParser,
//   recursive: MyDeepConditionalRecursiveType_boolean_Parser,
// }

// const MyDeepConditionalRecursiveType_boolean_Parser = {
//   prop: Wrap_boolean_boolean_Parser
// }

// const Wrap_boolean_boolean_Parser = {
//   w: BooleanParser,
//   b: BooleanParser,
//   recursive: MyDeepConditionalRecursiveType_boolean_Parser,
// }

// // MyDeepConditionalRecursiveType<string>

// const MyDeepConditionalRecursiveType_string_Parser = {
//   prop: Wrap_string_number_Parser
// }

// const Wrap_string_number_Parser = {
//   w: StringParser,
//   b: NumberParser,
//   recursive: MyDeepConditionalRecursiveType_number_Parser,
// }
