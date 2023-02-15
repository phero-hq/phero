import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("array", () => {
  test(`string[]`, () => {
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
  test("Array<boolean>", () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): Array<boolean> { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        root: {
          type: "array",
          element: {
            type: "arrayElement",
            parser: {
              type: "boolean",
            },
          },
        },
        deps: {},
      }),
    )
  })
  test("Array<Array<boolean>>", () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): Array<Array<boolean>> { throw new Error() }
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
  test("SomeGenericArray<boolean>", () => {
    const modelMap = generateParserModelForReturnType(`
      type SomeGenericArray<T> = Array<Array<T>>
      function test(): SomeGenericArray<boolean> { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual(
      expect.objectContaining({
        root: {
          type: "reference",
          typeName: "SomeGenericArray<boolean>",
          typeArguments: [
            {
              type: "boolean",
            },
          ],
        },
        deps: {
          "SomeGenericArray<boolean>": {
            type: "generic",
            typeName: "SomeGenericArray<boolean>",
            typeArguments: [
              {
                type: "boolean",
              },
            ],
            parser: {
              type: "array",
              element: {
                type: "arrayElement",
                parser: {
                  type: "array",
                  element: {
                    type: "arrayElement",
                    parser: {
                      type: "boolean",
                    },
                  },
                },
              },
            },
          },
        },
      }),
    )
  })
})
