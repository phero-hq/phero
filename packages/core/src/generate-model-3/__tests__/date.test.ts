import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("Date", () => {
  test("Date", () => {
    const modelMap = generateParserModelMap(`
      interface Test {
        createdAt: Date
      }

      function test(): Test { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Test",
      },
      deps: {
        Test: {
          type: "object",
          members: [
            {
              type: "member",
              name: "createdAt",
              optional: false,
              parser: {
                type: "date",
              },
            },
          ],
        },
      },
    })
  })
  test("Date", () => {
    const modelMap = generateParserModelMap(`
      type Test = [string, Date]

      function test(): Test { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Test",
      },
      deps: {
        Test: {
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
                type: "date",
              },
            },
          ],
        },
      },
    })
  })
})
