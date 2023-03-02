import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("Date", () => {
  test("Date", () => {
    const parsers = generateParsersForFunction(`
      interface Test {
        createdAt: Date
      }

      function test(): Test { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `TestParser`,
      deps: {
        TestParser: `parser.ObjectLiteral(["createdAt", false, parser.Date])`,
      },
    })
  })
  test("Date", () => {
    const parsers = generateParsersForFunction(`
      type Test = [string, Date]

      function test(): Test { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `TestParser`,
      deps: {
        TestParser: `parser.Tuple([parser.String], [parser.Date])`,
      },
    })
  })
})
