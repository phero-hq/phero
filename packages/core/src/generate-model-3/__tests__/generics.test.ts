import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("generics", () => {
  test("MyInterface<number>", () => {
    const modelMap = generateParserModelMap(`
      interface MyInterface<T> {
        prop: T
      }
      function test(): MyInterface<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyInterface<number>",
      },
      deps: {
        "MyInterface<number>": {
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
  test("MyInterface", () => {
    const modelMap = generateParserModelMap(`
      interface MyInterface<T = number> {
        prop: T
      }
      function test(): MyInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyInterface<number>",
      },
      deps: {
        "MyInterface<number>": {
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
  test("MyTypeAlias<number>", () => {
    const modelMap = generateParserModelMap(`
      type MyTypeAlias<T> = {
        prop: T
      }
      function test(): MyTypeAlias<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyTypeAlias<number>",
      },
      deps: {
        "MyTypeAlias<number>": {
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
  test("DeepGeneric<number>", () => {
    const modelMap = generateParserModelMap(`
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

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "DeepGeneric<number>",
      },
      deps: {
        "DeepGeneric<number>": {
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
            {
              type: "member",
              name: "nonGenericProp",
              optional: false,
              parser: {
                type: "boolean",
              },
            },
          ],
        },
        "Wrap<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "wrap",
              optional: false,
              parser: {
                type: "number",
              },
            },
            {
              type: "member",
              name: "nonGenericWrap",
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
  test("EmbeddedGeneric<number>", () => {
    const modelMap = generateParserModelMap(`
      interface EmbeddedGeneric<T> {
        embed: {
          prop: T
        }
      }
      function test(): EmbeddedGeneric<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "EmbeddedGeneric<number>",
      },
      deps: {
        "EmbeddedGeneric<number>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "embed",
              optional: false,
              parser: {
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
          ],
        },
      },
    })
  })
  test("GenericWithDefault<number>", () => {
    const modelMap = generateParserModelMap(`
      interface GenericWithDefault<T, X = string> {
        prop: T
        propDef: X
      }
      function test(): GenericWithDefault<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "GenericWithDefault<number, string>",
      },
      deps: {
        "GenericWithDefault<number, string>": {
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
            {
              type: "member",
              name: "propDef",
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
})
