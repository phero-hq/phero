import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("typeAlias", () => {
  test(`type X = string`, () => {
    const modelMap = generateParserModelForReturnType(`
        type X = string

        function test(): X { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
          type: "string",
        },
      },
    })
  })
  test(`type X = Y`, () => {
    const modelMap = generateParserModelForReturnType(`
      type Y = number  
      type X = Y

      function test(): X { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
          type: "reference",
          typeName: "Y",
        },
        Y: {
          type: "number",
        },
      },
    })
  })
  test(`type X = { y: Y }`, () => {
    const modelMap = generateParserModelForReturnType(`
      type Y = number  
      type X = { y: Y }

      function test(): X { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
          type: "object",
          members: [
            {
              type: "member",
              name: "y",
              optional: false,
              parser: {
                type: "reference",
                typeName: "Y",
              },
            },
          ],
        },
        Y: {
          type: "number",
        },
      },
    })
  })
  test(`type X = { y: Y | Z }`, () => {
    const modelMap = generateParserModelForReturnType(`
      type Z = boolean
      type Y = number  
      type X = { y: Y | Z }

      function test(): X { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "X",
      },
      deps: {
        X: {
          type: "object",
          members: [
            {
              type: "member",
              name: "y",
              optional: false,
              parser: {
                type: "union",
                oneOf: [
                  {
                    type: "reference",
                    typeName: "Y",
                  },
                  {
                    type: "reference",
                    typeName: "Z",
                  },
                ],
              },
            },
          ],
        },
        Y: {
          type: "number",
        },
        Z: {
          type: "boolean",
        },
      },
    })
  })
  test(`type X = [string, Y]`, () => {
    const modelMap = generateParserModelForReturnType(`
      type Y = number
      type X = [string, Y]

      function test(): X { throw new Error() }
    `)

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
                type: "reference",
                typeName: "Y",
              },
            },
          ],
        },
        Y: {
          type: "number",
        },
      },
    })
  })
})
