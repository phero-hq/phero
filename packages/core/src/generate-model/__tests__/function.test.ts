import { generateParserModelForFunction } from "../../lib/tsTestUtils"

describe("function", () => {
  test(`add function`, () => {
    const modelMap = generateParserModelForFunction(`
      function test(a: number, b: number): number { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        returnType: {
          type: "number",
        },
        parameters: {
          type: "object",
          members: [
            {
              type: "member",
              optional: false,
              name: "a",
              parser: { type: "number" },
            },
            {
              type: "member",
              optional: false,
              name: "b",
              parser: { type: "number" },
            },
          ],
        },
        deps: {},
      }),
    )
  })

  test(`function with generic parameters and return type`, () => {
    const modelMap = generateParserModelForFunction(`
      type Wrapper<T> = { t: T }
      function test(a: Wrapper<number>, b: Wrapper<string>): Wrapper<boolean> { throw new Error() }
    `)

    expect(modelMap).toEqual(
      expect.objectContaining({
        returnType: {
          type: "reference",
          typeName: "Wrapper<boolean>",
          typeArguments: [
            {
              type: "boolean",
            },
          ],
        },
        parameters: {
          type: "object",
          members: [
            {
              type: "member",
              optional: false,
              name: "a",
              parser: {
                type: "reference",
                typeName: "Wrapper<number>",
                typeArguments: [
                  {
                    type: "number",
                  },
                ],
              },
            },
            {
              type: "member",
              optional: false,
              name: "b",
              parser: {
                type: "reference",
                typeName: "Wrapper<string>",
                typeArguments: [
                  {
                    type: "string",
                  },
                ],
              },
            },
          ],
        },
        deps: {
          "Wrapper<boolean>": {
            type: "generic",
            typeName: "Wrapper<boolean>",
            typeArguments: [
              {
                type: "boolean",
              },
            ],
            parser: {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "t",
                  optional: false,
                  parser: { type: "boolean" },
                },
              ],
            },
          },
          "Wrapper<string>": {
            type: "generic",
            typeName: "Wrapper<string>",
            typeArguments: [
              {
                type: "string",
              },
            ],
            parser: {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "t",
                  optional: false,
                  parser: { type: "string" },
                },
              ],
            },
          },
          "Wrapper<number>": {
            type: "generic",
            typeName: "Wrapper<number>",
            typeArguments: [
              {
                type: "number",
              },
            ],
            parser: {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "t",
                  optional: false,
                  parser: { type: "number" },
                },
              ],
            },
          },
        },
      }),
    )
  })
})
