import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("intersection", () => {
  test(`{ a: string} & { b: string }`, () => {
    const modelMap = generateParserModelMap(`
        function test(): { a: string} & { b: string } { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "intersection",
        parsers: [
          {
            type: "object",
            members: [
              {
                type: "member",
                name: "a",
                optional: false,
                parser: { type: "string" },
              },
            ],
          },
          {
            type: "object",
            members: [
              {
                type: "member",
                name: "b",
                optional: false,
                parser: { type: "string" },
              },
            ],
          },
        ],
      },
      deps: {},
    })
  })
  test(`{ a: string} & { b?: number[] }`, () => {
    const modelMap = generateParserModelMap(`
        function test(): { a: string} & { b?: number[] } { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "intersection",
        parsers: [
          {
            type: "object",
            members: [
              {
                type: "member",
                name: "a",
                optional: false,
                parser: { type: "string" },
              },
            ],
          },
          {
            type: "object",
            members: [
              {
                type: "member",
                name: "b",
                optional: true,
                parser: {
                  type: "array",
                  element: { type: "arrayElement", parser: { type: "number" } },
                },
              },
            ],
          },
        ],
      },
      deps: {},
    })
  })
})
