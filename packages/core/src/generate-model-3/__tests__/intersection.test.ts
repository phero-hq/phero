import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("intersection", () => {
  test(`{ a: string} & { b: string }`, () => {
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
  test(`InterfaceOne & InterfaceTwo`, () => {
    const modelMap = generateParserModelForReturnType(`
        interface InterfaceOne {
          prop1: number
        }
        interface InterfaceTwo {
          prop2: string
        }
        function test(): InterfaceOne & InterfaceTwo { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "intersection",
        parsers: [
          {
            type: "reference",
            typeName: "InterfaceOne",
          },
          {
            type: "reference",
            typeName: "InterfaceTwo",
          },
        ],
      },
      deps: {
        InterfaceOne: {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop1",
              optional: false,
              parser: { type: "number" },
            },
          ],
        },
        InterfaceTwo: {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop2",
              optional: false,
              parser: { type: "string" },
            },
          ],
        },
      },
    })
  })
})
