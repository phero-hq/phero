import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("tuple", () => {
  test(`[string, string]`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): [string, string] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "tuple",
        elements: [
          { type: "tupleElement", position: 0, parser: { type: "string" } },
          { type: "tupleElement", position: 1, parser: { type: "string" } },
        ],
      },
      deps: {},
    })
  })
  test(`[string, 123, boolean]`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): [string, 123, boolean] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "tuple",
        elements: [
          { type: "tupleElement", position: 0, parser: { type: "string" } },
          {
            type: "tupleElement",
            position: 1,
            parser: { type: "number-literal", literal: 123 },
          },
          { type: "tupleElement", position: 2, parser: { type: "boolean" } },
        ],
      },
      deps: {},
    })
  })
  test(`["aap"]`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): ["aap"] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "tuple",
        elements: [
          {
            type: "tupleElement",
            position: 0,
            parser: { type: "string-literal", literal: "aap" },
          },
        ],
      },
      deps: {},
    })
  })
  test(`[123 | "str", number]`, () => {
    const modelMap = generateParserModelForReturnType(`
        function test(): [123 | "str", number] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "tuple",
        elements: [
          {
            type: "tupleElement",
            position: 0,
            parser: {
              type: "union",
              oneOf: [
                { type: "number-literal", literal: 123 },
                { type: "string-literal", literal: "str" },
              ],
            },
          },
          {
            type: "tupleElement",
            position: 1,
            parser: { type: "number" },
          },
        ],
      },
      deps: {},
    })
  })
  test(`[string, X]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = number
      
      function test(): [string, X] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "tuple",
        elements: [
          {
            type: "tupleElement",
            position: 0,
            parser: {
              type: "string",
            },
          },
          {
            type: "tupleElement",
            position: 1,
            parser: {
              type: "reference",
              typeName: "X",
            },
          },
        ],
      },
      deps: {
        X: {
          type: "number",
        },
      },
    })
  })
})

// TODO tuple with spread [number, ...string]
