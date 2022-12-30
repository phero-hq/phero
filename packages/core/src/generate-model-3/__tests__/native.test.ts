import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("native", () => {
  test("string", () => {
    const modelMap = generateParserModelMap(`
      function test(): string { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "string" },
      deps: {},
    })
  })
  test("number", () => {
    const modelMap = generateParserModelMap(`
      function test(): number { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "number" },
      deps: {},
    })
  })
  test("boolean", () => {
    const modelMap = generateParserModelMap(`
      function test(): boolean { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "boolean" },
      deps: {},
    })
  })
})
