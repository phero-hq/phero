import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("literal", () => {
  test(`"str"`, () => {
    const modelMap = generateParserModelMap(`
      function test(): "str" { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "string-literal", literal: "str" },
      deps: {},
    })
  })
  test("123", () => {
    const modelMap = generateParserModelMap(`
      function test(): 123 { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "number-literal", literal: 123 },
      deps: {},
    })
  })
  test("false", () => {
    const modelMap = generateParserModelMap(`
      function test(): false { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "boolean-literal", literal: false },
      deps: {},
    })
  })
  test("9007199254740991n", () => {
    const modelMap = generateParserModelMap(`
      function test(): 9007199254740991n { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "bigInt-literal",
        literal: {
          base10Value: "9007199254740991",
          negative: false,
        },
      },
      deps: {},
    })
  })
})
