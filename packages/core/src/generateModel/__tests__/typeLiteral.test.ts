import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("typeLiteral", () => {
  test(`{ prop: string }`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): { prop: string } { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "member",
            name: "prop",
            optional: false,
            parser: { type: "string" },
          },
        ],
      },
      deps: {},
    })
  })
  test(`{ prop1: string, prop2: number  }`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): { prop1: string, prop2: number } { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "member",
            name: "prop1",
            optional: false,
            parser: { type: "string" },
          },
          {
            type: "member",
            name: "prop2",
            optional: false,
            parser: { type: "number" },
          },
        ],
      },
      deps: {},
    })
  })
  test(`{ prop?: boolean  }`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): { prop?: boolean } { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "member",
            name: "prop",
            optional: true,
            parser: { type: "boolean" },
          },
        ],
      },
      deps: {},
    })
  })
  test(`{ prop1: string | 123, prop2?: boolean[] }`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): { prop1: string | 123, prop2?: boolean[] } { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "member",
            name: "prop1",
            optional: false,
            parser: {
              type: "union",
              oneOf: [
                { type: "string" },
                { type: "number-literal", literal: 123 },
              ],
            },
          },
          {
            type: "member",
            name: "prop2",
            optional: true,
            parser: {
              type: "array",
              element: {
                type: "arrayElement",
                parser: { type: "boolean" },
              },
            },
          },
        ],
      },
      deps: {},
    })
  })
  test(`{ prop1: string, prop2: { prop3: boolean, prop4: { prop5: number, prop6?: "prop6" } } }`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): { prop1: string, prop2: { prop3: boolean, prop4: { prop5: number, prop6?: "prop6" } } } { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "member",
            name: "prop1",
            optional: false,
            parser: {
              type: "string",
            },
          },
          {
            type: "member",
            name: "prop2",
            optional: false,
            parser: {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "prop3",
                  optional: false,
                  parser: {
                    type: "boolean",
                  },
                },
                {
                  type: "member",
                  name: "prop4",
                  optional: false,
                  parser: {
                    type: "object",
                    members: [
                      {
                        type: "member",
                        name: "prop5",
                        optional: false,
                        parser: {
                          type: "number",
                        },
                      },
                      {
                        type: "member",
                        name: "prop6",
                        optional: true,
                        parser: {
                          type: "string-literal",
                          literal: "prop6",
                        },
                      },
                    ],
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
})
