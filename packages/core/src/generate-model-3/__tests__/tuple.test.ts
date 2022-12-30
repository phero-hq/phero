import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("tuple", () => {
  test(`[string, string]`, () => {
    const modelMap = generateParserModelMap(`
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
    const modelMap = generateParserModelMap(`
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
    const modelMap = generateParserModelMap(`
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
    const modelMap = generateParserModelMap(`
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
})

// TODO tuple with spread [number, ...string]
