import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("generics", () => {
  test("MyInterface<number>", () => {
    const modelMap = generateParserModelForReturnType(`
      interface MyInterface<T> {
        prop: T
      }
      function test(): MyInterface<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyInterface<number>",
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "MyInterface<number>": {
          type: "generic",
          typeArguments: [{ type: "number" }],
          typeName: "MyInterface<number>",
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
      },
    })
  })
  test("MyInterface", () => {
    const modelMap = generateParserModelForReturnType(`
      interface MyInterface<T = number> {
        prop: T
      }
      function test(): MyInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyInterface<number>",
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "MyInterface<number>": {
          type: "generic",
          typeArguments: [{ type: "number" }],
          typeName: "MyInterface<number>",
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
      },
    })
  })
  test("MyTypeAlias<number>", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyTypeAlias<T> = {
        prop: T
      }
      function test(): MyTypeAlias<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyTypeAlias<number>",
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "MyTypeAlias<number>": {
          type: "generic",
          typeArguments: [{ type: "number" }],
          typeName: "MyTypeAlias<number>",
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
      },
    })
  })
  test("DeepGeneric<number>", () => {
    const modelMap = generateParserModelForReturnType(`
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
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "DeepGeneric<number>": {
          type: "generic",
          typeArguments: [{ type: "number" }],
          typeName: "DeepGeneric<number>",
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "prop",
                optional: false,
                parser: {
                  type: "reference",
                  typeName: "Wrap<number>",
                  typeArguments: [{ type: "number" }],
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
        },
        "Wrap<number>": {
          type: "generic",
          typeArguments: [{ type: "number" }],
          typeName: "Wrap<number>",
          parser: {
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
      },
    })
  })
  test("EmbeddedGeneric<number>", () => {
    const modelMap = generateParserModelForReturnType(`
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
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "EmbeddedGeneric<number>": {
          type: "generic",
          typeArguments: [{ type: "number" }],
          typeName: "EmbeddedGeneric<number>",
          parser: {
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
      },
    })
  })
  test("GenericWithDefault<number>", () => {
    const modelMap = generateParserModelForReturnType(`
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
        typeArguments: [{ type: "number" }, { type: "string" }],
      },
      deps: {
        "GenericWithDefault<number, string>": {
          type: "generic",
          typeArguments: [{ type: "number" }, { type: "string" }],
          typeName: "GenericWithDefault<number, string>",
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
      },
    })
  })
})
