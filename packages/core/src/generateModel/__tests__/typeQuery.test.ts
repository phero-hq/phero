import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("typeQuery", () => {
  test(`typeof {} as const`, () => {
    const modelMap = generateParserModelForReturnType(`
      const myConst = {
        a: [1, 2],
        b: [3, 4],
      } as const
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Example",
      },
      deps: {
        Example: {
          type: "object",
          members: [
            {
              type: "member",
              name: "a",
              optional: false,
              parser: {
                type: "tuple",
                elements: [
                  {
                    type: "tupleElement",
                    position: 0,
                    parser: {
                      type: "number-literal",
                      literal: 1,
                    },
                  },
                  {
                    type: "tupleElement",
                    position: 1,
                    parser: {
                      type: "number-literal",
                      literal: 2,
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
                type: "tuple",
                elements: [
                  {
                    type: "tupleElement",
                    position: 0,
                    parser: {
                      type: "number-literal",
                      literal: 3,
                    },
                  },
                  {
                    type: "tupleElement",
                    position: 1,
                    parser: {
                      type: "number-literal",
                      literal: 4,
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
  test(`typeof {}`, () => {
    const modelMap = generateParserModelForReturnType(`
      const myConst = {
        a: [1, 2],
        b: [3, 4],
      }
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Example",
      },
      deps: {
        Example: {
          type: "object",
          members: [
            {
              type: "member",
              name: "a",
              optional: false,
              parser: {
                type: "array",
                element: {
                  type: "arrayElement",
                  parser: {
                    type: "number",
                  },
                },
              },
            },
            {
              type: "member",
              name: "b",
              optional: false,
              parser: {
                type: "array",
                element: {
                  type: "arrayElement",
                  parser: {
                    type: "number",
                  },
                },
              },
            },
          ],
        },
      },
    })
  })
  test(`typeof [] as const`, () => {
    const modelMap = generateParserModelForReturnType(`
      const myConst = [
        {
          a: 123
        },
        {
          b: 456,
        }
      ] as const
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Example",
      },
      deps: {
        Example: {
          type: "tuple",
          elements: [
            {
              type: "tupleElement",
              position: 0,
              parser: {
                type: "object",
                members: [
                  {
                    type: "member",
                    name: "a",
                    optional: false,
                    parser: {
                      type: "number-literal",
                      literal: 123,
                    },
                  },
                ],
              },
            },
            {
              type: "tupleElement",
              position: 1,
              parser: {
                type: "object",
                members: [
                  {
                    type: "member",
                    name: "b",
                    optional: false,
                    parser: {
                      type: "number-literal",
                      literal: 456,
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
  test(`typeof []`, () => {
    const modelMap = generateParserModelForReturnType(`
      const myConst = [
        {
          a: 123
        },
        {
          b: 456,
        }
      ]
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Example",
      },
      deps: {
        Example: {
          type: "array",
          element: {
            type: "arrayElement",
            parser: {
              // TODO suboptimal, but okay for now
              type: "union",
              oneOf: [
                {
                  type: "object",
                  members: [
                    {
                      type: "member",
                      name: "a",
                      optional: false,
                      parser: {
                        type: "number-literal",
                        literal: 123,
                      },
                    },
                    {
                      type: "member",
                      name: "b",
                      optional: true,
                      parser: {
                        type: "number-literal",
                        literal: 456,
                      },
                    },
                  ],
                },
                {
                  type: "object",
                  members: [
                    {
                      type: "member",
                      name: "b",
                      optional: false,
                      parser: {
                        type: "number-literal",
                        literal: 456,
                      },
                    },
                    {
                      type: "member",
                      name: "a",
                      optional: true,
                      parser: {
                        type: "number-literal",
                        literal: 123,
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    })
  })
  test(`typeof "str" as const`, () => {
    const modelMap = generateParserModelForReturnType(`
      const myConst = "str" as const
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Example",
      },
      deps: {
        Example: {
          type: "string-literal",
          literal: "str",
        },
      },
    })
  })
  test(`typeof () => 123`, () => {
    expect(() =>
      generateParserModelForReturnType(`
      const myConst = () => 123 as const
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `),
    ).toThrowError("Can't make a parser for a function type")
  })
  test(`typeof enums`, () => {
    const modelMap = generateParserModelForReturnType(`
      enum Aad {
        Aap = "aap",
        Noot = "noot",
      }

      enum Abc {
        A = "a",
        B = "b",
        C = "c",
        D = "d",
      }

      const myConst = {
        [Aad.Aap]: [
          Abc.A,
          Abc.B,
        ],
        [Aad.Noot]: [
          Abc.C,
          Abc.D,
        ],
      } as const

      export type Example = typeof myConst

      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Example",
      },
      deps: {
        Example: {
          type: "object",
          members: [
            {
              type: "member",
              name: "aap",
              optional: false,
              parser: {
                type: "tuple",
                elements: [
                  {
                    type: "tupleElement",
                    position: 0,
                    parser: {
                      type: "string-literal",
                      literal: "a",
                    },
                  },
                  {
                    type: "tupleElement",
                    position: 1,
                    parser: {
                      type: "string-literal",
                      literal: "b",
                    },
                  },
                ],
              },
            },
            {
              type: "member",
              name: "noot",
              optional: false,
              parser: {
                type: "tuple",
                elements: [
                  {
                    type: "tupleElement",
                    position: 0,
                    parser: {
                      type: "string-literal",
                      literal: "c",
                    },
                  },
                  {
                    type: "tupleElement",
                    position: 1,
                    parser: {
                      type: "string-literal",
                      literal: "d",
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
})
