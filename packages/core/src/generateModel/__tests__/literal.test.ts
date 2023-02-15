import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("literal", () => {
  test(`"str"`, () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): "str" { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "string-literal", literal: "str" },
      deps: {},
    })
  })
  test("123", () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): 123 { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "number-literal", literal: 123 },
      deps: {},
    })
  })
  test("false", () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): false { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: { type: "boolean-literal", literal: false },
      deps: {},
    })
  })
  test("9007199254740991n", () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): 9007199254740991n { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "bigint-literal",
        literal: {
          base10Value: "9007199254740991",
          negative: false,
        },
      },
      deps: {},
    })
  })
})
