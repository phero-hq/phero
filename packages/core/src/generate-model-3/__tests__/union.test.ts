import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("union", () => {
  test(`string | number | boolean`, () => {
    const modelMap = generateParserModelMap(`
        function test(): string | number | boolean { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "union",
        oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
      },
      deps: {},
    })
  })
  test(`"str" | 123 | false`, () => {
    const modelMap = generateParserModelMap(`
        function test(): "str" | 123 | false { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "union",
        oneOf: [
          { type: "string-literal", literal: "str" },
          { type: "number-literal", literal: 123 },
          { type: "boolean-literal", literal: false },
        ],
      },
      deps: {},
    })
  })
  test(`(string | 123)[]`, () => {
    const modelMap = generateParserModelMap(`
        function test(): (string | 123)[] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "array",
        element: {
          type: "arrayElement",
          parser: {
            type: "union",
            oneOf: [
              { type: "string" },
              { type: "number-literal", literal: 123 },
            ],
          },
        },
      },
      deps: {},
    })
  })
  test(`number[] | "yes"[]`, () => {
    const modelMap = generateParserModelMap(`
        function test(): number[] | "yes"[] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "union",
        oneOf: [
          {
            type: "array",
            element: {
              type: "arrayElement",
              parser: {
                type: "number",
              },
            },
          },
          {
            type: "array",
            element: {
              type: "arrayElement",
              parser: {
                type: "string-literal",
                literal: "yes",
              },
            },
          },
        ],
      },
      deps: {},
    })
  })
  test(`InterfaceOne | InterfaceTwo[]`, () => {
    const modelMap = generateParserModelMap(`
        interface InterfaceOne {
          prop: 1
        }
        interface InterfaceTwo {
          prop: 2
        }
        function test(): InterfaceOne | InterfaceTwo[] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "union",
        oneOf: [
          {
            type: "reference",
            typeName: "InterfaceOne",
          },
          {
            type: "array",
            element: {
              type: "arrayElement",
              parser: {
                type: "reference",
                typeName: "InterfaceTwo",
              },
            },
          },
        ],
      },
      deps: {
        InterfaceOne: {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: { type: "number-literal", literal: 1 },
            },
          ],
        },
        InterfaceTwo: {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: { type: "number-literal", literal: 2 },
            },
          ],
        },
      },
    })
  })
})
