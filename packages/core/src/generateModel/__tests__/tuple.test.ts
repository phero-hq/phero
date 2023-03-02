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
  test(`[string, ...number[]]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [string, ...number[]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test(`[string, ...number[], boolean]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [string, ...number[], boolean]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "number",
              },
            },
            {
              type: "tupleElement",
              position: 2,
              parser: {
                type: "boolean",
              },
            },
          ],
        },
      },
    })
  })
  test(`[string, ...number[][]]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [string, ...number[][]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
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
  test(`[string, ...Array<number>]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [string, ...Array<number>]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test(`[string, ...Array<number>, boolean]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [string, ...Array<number>, boolean]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "number",
              },
            },
            {
              type: "tupleElement",
              position: 2,
              parser: {
                type: "boolean",
              },
            },
          ],
        },
      },
    })
  })
  test(`[string, ...Array<Array<number>>]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [string, ...Array<Array<number>>]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
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
  test(`[string, ...[string, number]]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [string, ...[string, number]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
                type: "string",
              },
            },
            {
              type: "tupleElement",
              position: 2,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test(`[string, ...Y]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type Y = [number, string]
      type X = [string, ...Y]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "reference",
                typeName: "Y",
              },
            },
          ],
        },
        Y: {
          type: "tuple",
          elements: [
            {
              type: "tupleElement",
              position: 0,
              parser: {
                type: "number",
              },
            },
            {
              type: "tupleElement",
              position: 1,
              parser: {
                type: "string",
              },
            },
          ],
        },
      },
    })
  })
  test(`[string, ...Y<string>]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type Y<T, A = T extends string ? number : boolean> = [T, A]
      
      type X = [number, ...Y<string>]
      
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
          type: "tuple",
          elements: [
            {
              type: "tupleElement",
              position: 0,
              parser: {
                type: "number",
              },
            },
            {
              type: "tupleElement",
              position: 1,
              isRestElement: true,
              parser: {
                type: "reference",
                typeName: "Y<string, number>",
                typeArguments: [
                  {
                    type: "string",
                  },
                  {
                    type: "number",
                  },
                ],
              },
            },
          ],
        },
        "Y<string, number>": {
          type: "generic",
          typeName: "Y<string, number>",
          typeArguments: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
          parser: {
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
                  type: "number",
                },
              },
            ],
          },
        },
      },
    })
  })
  test(`[lat: number, long: number]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [lat: number, long: number]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
          type: "tuple",
          elements: [
            {
              type: "tupleElement",
              position: 0,
              parser: {
                type: "number",
              },
            },
            {
              type: "tupleElement",
              position: 1,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test(`[myString: string, ...myNumber: number[]]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [myString: string, ...myNumber: number[]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test(`[myString: string, ...myNumber: Array<number>]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type X = [myString: string, ...myNumber: Array<number>]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test(`[myString: string, ...myNumber: Y]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type Y = [a: string, b: boolean]
      type X = [myString: string, ...myTuple: Y]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
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
              isRestElement: true,
              parser: {
                type: "reference",
                typeName: "Y",
              },
            },
          ],
        },
        Y: {
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
                type: "boolean",
              },
            },
          ],
        },
      },
    })
  })
  test(`Parameters<typeof fn>`, () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): X { throw new Error() }
      
      type X = Parameters<typeof fn>  
      function fn(lng: number, lat: number) {}
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
          type: "tuple",
          elements: [
            {
              type: "tupleElement",
              position: 0,
              parser: {
                type: "number",
              },
            },
            {
              type: "tupleElement",
              position: 1,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
})
