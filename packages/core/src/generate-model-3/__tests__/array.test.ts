import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("array", () => {
  test(`string[]`, () => {
    const modelMap = generateParserModelMap(`
      function test(): string[] { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        root: {
          type: "array",
          element: { type: "arrayElement", parser: { type: "string" } },
        },
        deps: {},
      }),
    )
  })
  test("number[]", () => {
    const modelMap = generateParserModelMap(`
      function test(): number[] { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        root: {
          type: "array",
          element: { type: "arrayElement", parser: { type: "number" } },
        },
        deps: {},
      }),
    )
  })
  test("boolean", () => {
    const modelMap = generateParserModelMap(`
      function test(): boolean[] { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        root: {
          type: "array",
          element: { type: "arrayElement", parser: { type: "boolean" } },
        },
        deps: {},
      }),
    )
  })

  test(`string[][]`, () => {
    const modelMap = generateParserModelMap(`
      function test(): string[][] { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        root: {
          type: "array",
          element: {
            type: "arrayElement",
            parser: {
              type: "array",
              element: { type: "arrayElement", parser: { type: "string" } },
            },
          },
        },
        deps: {},
      }),
    )
  })

  test("number[][]", () => {
    const modelMap = generateParserModelMap(`
      function test(): number[][] { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "array",
        element: {
          type: "arrayElement",
          parser: {
            type: "array",
            element: { type: "arrayElement", parser: { type: "number" } },
          },
        },
      },
      deps: {},
    })
  })
  test("boolean[][]", () => {
    const modelMap = generateParserModelMap(`
      function test(): boolean[][] { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        root: {
          type: "array",
          element: {
            type: "arrayElement",
            parser: {
              type: "array",
              element: { type: "arrayElement", parser: { type: "boolean" } },
            },
          },
        },
        deps: {},
      }),
    )
  })
})

// TODO Array<number> & Array<Array<number>>
