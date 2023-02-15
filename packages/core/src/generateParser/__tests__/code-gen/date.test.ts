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
      output: `TestParser`,
      deps: {
        TestParser: `ObjectLiteralParser(["createdAt", false, DateParser])`,
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
      output: `TestParser`,
      deps: {
        TestParser: `TupleParser([StringParser], [DateParser])`,
      },
    })
  })
})
