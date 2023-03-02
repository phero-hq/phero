import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("native", () => {
  test("string", () => {
    const parsers = generateParsersForFunction(`
      function test(): string { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))

    expect(parsers.output).toEqual(`parser.String`)
  })
  test("number", () => {
    const parsers = generateParsersForFunction(`
      function test(): number { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))

    expect(parsers.output).toEqual(`parser.Number`)
  })
  test("boolean", () => {
    const parsers = generateParsersForFunction(`
      function test(): boolean { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))

    expect(parsers.output).toEqual(`parser.Boolean`)
  })
})
