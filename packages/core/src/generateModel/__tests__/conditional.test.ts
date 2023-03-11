import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("conditional", () => {
  test("MyConditionalType<number>", () => {
    const modelMap = generateParserModelForReturnType(`
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
      deps: {},
    })
  })
  test("MyConditionalType<string>", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyConditionalType<T> = T extends string ? {
        prop: number
      } : {
        prop: string
      }
      function test(): MyConditionalType<string> { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
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
      deps: {},
    })
  })
  test("MyDeepConditionalType<number>", () => {
    const modelMap = generateParserModelForReturnType(`
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
    // console.log(JSON.stringify(modelMap, null, 4))
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
  test("MyDeepConditionalType<number>", () => {
    const modelMap = generateParserModelForReturnType(`
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
            ],
          },
        },
      },
    })
  })
  test("MyType<number>", () => {
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
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
        ],
      },
      deps: {},
    })
  })
  test("MyConditionalType<boolean>", () => {
    const modelMap = generateParserModelForReturnType(`
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
      function test(): MyConditionalType<boolean, Hop<number>> { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
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
        ],
      },
      deps: {},
    })
  })
  test("a conditional type with or without a declared type should work the same", () => {
    const modelMapA = generateParserModelForReturnType(`
      type MyConditionalType<T, K> = T extends string ? RRR<number, K> : RRR<string, K>;
      interface RRR<X, Y> {
          prop: X;
          x: Y;
      }
      interface Hop<H> {
        h: H
      }
      function test(): MyConditionalType<boolean, Hop<number>> { throw new Error() }
    `)

    const modelMapB = generateParserModelForReturnType(`
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
      function test(): MyConditionalType<boolean, Hop<number>> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMapA).toEqual(modelMapB)
  })
  test("ConditionalType with reference with default param", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyConditionalType<K> = K extends string ? TheInterface : never

      type TheInterface<T = boolean> = {
        prop: T
      }

      function test(): MyConditionalType<string> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "member",
            name: "prop",
            optional: false,
            parser: {
              type: "boolean",
            },
          },
        ],
      },
      deps: {},
    })
  })
  test("ConditionalType with reference with given param", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyConditionalType<K> = K extends string ? TheInterface<number> : never

      interface TheInterface<T = boolean> {
        prop: T
      }

      function test(): MyConditionalType<string> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
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
      deps: {},
    })
  })
  test("ConditionalType with reference with given param", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyConditional<K, P = K extends string ? number : never> = {
        prop: P
      }

      interface TheInterface<T = string> {
        prop: T
      }

      function test(): MyConditional<string> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyConditional<string, number>",
        typeArguments: [
          {
            type: "string",
          },
          {
            type: "number",
          },
        ],
      },
      deps: {
        "MyConditional<string, number>": {
          type: "generic",
          typeArguments: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
          typeName: "MyConditional<string, number>",
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
  test("ConditionalType with reference with given param", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyConditional<K> = K extends string ? TheInterface<number> : never

      interface TheInterface<T = string> {
        prop: T
      }

      function test(): MyConditional<string> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
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
      deps: {},
    })
  })
  test("ConditionalType with reference with given param", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyConditional<K> = K extends string ? TheInterface<number> | number : never

      interface TheInterface<X = boolean> {
        prop: X
      }

      function test(): MyConditional<string> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "union",
        oneOf: expect.arrayContaining([
          {
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
          {
            type: "number",
          },
        ]),
      },
      deps: {},
    })
  })
})
