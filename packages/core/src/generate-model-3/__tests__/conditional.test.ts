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
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyConditionalType<number>",
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "MyConditionalType<number>": {
          type: "generic",
          typeName: "MyConditionalType<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
          parser: {
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
        typeArguments: [{ type: "string" }],
      },
      deps: {
        "MyConditionalType<string>": {
          type: "generic",
          typeName: "MyConditionalType<string>",
          typeArguments: [
            {
              type: "string",
            },
          ],
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

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyDeepConditionalType<number>",
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "MyDeepConditionalType<number>": {
          type: "generic",
          typeName: "MyDeepConditionalType<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
          parser: {
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
                  typeArguments: [{ type: "string" }],
                },
              },
            ],
          },
        },
        "DeepCondition<string>": {
          type: "generic",
          typeName: "DeepCondition<string>",
          typeArguments: [
            {
              type: "string",
            },
          ],
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

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyDeepConditionalType<number>",
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "MyDeepConditionalType<number>": {
          type: "generic",
          typeName: "MyDeepConditionalType<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "deep",
                optional: false,
                parser: {
                  type: "reference",
                  typeName: "DeepCondition<number>",
                  typeArguments: [{ type: "number" }],
                },
              },
            ],
          },
        },
        "DeepCondition<number>": {
          type: "generic",
          typeName: "DeepCondition<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
          parser: {
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
        typeArguments: [{ type: "number" }],
      },
      deps: {
        "MyType<number>": {
          type: "generic",
          typeName: "MyType<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
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
            ],
          },
        },
        "Wrap<number>": {
          type: "generic",
          typeName: "Wrap<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
          parser: {
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
      },
    })
  })

  test("MyDeepConditionalRecursiveType<number>", () => {
    const modelMap = generateParserModelMap(`
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
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyDeepConditionalRecursiveType<number>",
        typeArguments: [
          {
            type: "number",
          },
        ],
      },
      deps: {
        "MyDeepConditionalRecursiveType<number>": {
          type: "generic",
          typeName: "MyDeepConditionalRecursiveType<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "prop",
                optional: false,
                parser: {
                  type: "reference",
                  typeName: "Wrap<number, boolean>",
                  typeArguments: [
                    {
                      type: "number",
                    },
                    {
                      type: "boolean",
                    },
                  ],
                },
              },
            ],
          },
        },
        "Wrap<number, boolean>": {
          type: "generic",
          typeName: "Wrap<number, boolean>",
          typeArguments: [
            {
              type: "number",
            },
            {
              type: "boolean",
            },
          ],
          parser: {
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
                  typeName: "MyDeepConditionalRecursiveType<{ b: boolean; }>",
                  typeArguments: [
                    {
                      type: "object",
                      members: [
                        {
                          type: "member",
                          name: "b",
                          optional: false,
                          parser: {
                            type: "boolean",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
        "MyDeepConditionalRecursiveType<{ b: boolean; }>": {
          type: "generic",
          typeName: "MyDeepConditionalRecursiveType<{ b: boolean; }>",
          typeArguments: [
            {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "b",
                  optional: false,
                  parser: {
                    type: "boolean",
                  },
                },
              ],
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "prop",
                optional: false,
                parser: {
                  type: "reference",
                  typeName: "Wrap<{ b: boolean; }, boolean>",
                  typeArguments: [
                    {
                      type: "object",
                      members: [
                        {
                          type: "member",
                          name: "b",
                          optional: false,
                          parser: {
                            type: "boolean",
                          },
                        },
                      ],
                    },
                    {
                      type: "boolean",
                    },
                  ],
                },
              },
            ],
          },
        },
        "Wrap<{ b: boolean; }, boolean>": {
          type: "generic",
          typeName: "Wrap<{ b: boolean; }, boolean>",
          typeArguments: [
            {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "b",
                  optional: false,
                  parser: {
                    type: "boolean",
                  },
                },
              ],
            },
            {
              type: "boolean",
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "w",
                optional: false,
                parser: {
                  type: "object",
                  members: [
                    {
                      type: "member",
                      name: "b",
                      optional: false,
                      parser: {
                        type: "boolean",
                      },
                    },
                  ],
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
                  typeName: "MyDeepConditionalRecursiveType<{ b: boolean; }>",
                  typeArguments: [
                    {
                      type: "object",
                      members: [
                        {
                          type: "member",
                          name: "b",
                          optional: false,
                          parser: {
                            type: "boolean",
                          },
                        },
                      ],
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
  test("MyConditionalType<number>", () => {
    const modelMap = generateParserModelMap(`
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

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyConditionalType<number, Hop<number>>",
        typeArguments: [
          {
            type: "number",
          },
          {
            type: "reference",
            typeName: "Hop<number>",
            typeArguments: [
              {
                type: "number",
              },
            ],
          },
        ],
      },
      deps: {
        "Hop<number>": {
          type: "generic",
          typeName: "Hop<number>",
          typeArguments: [
            {
              type: "number",
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "h",
                optional: false,
                parser: {
                  type: "number",
                },
              },
            ],
          },
        },
        "MyConditionalType<number, Hop<number>>": {
          type: "generic",
          typeName: "MyConditionalType<number, Hop<number>>",
          typeArguments: [
            {
              type: "number",
            },
            {
              type: "reference",
              typeName: "Hop<number>",
              typeArguments: [
                {
                  type: "number",
                },
              ],
            },
          ],
          parser: {
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
              {
                type: "member",
                name: "x",
                optional: false,
                parser: {
                  type: "reference",
                  typeName: "Hop<number>",
                  typeArguments: [
                    {
                      type: "number",
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
