import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("interface", () => {
  test(`SimpleInterface`, () => {
    const modelMap = generateParserModelMap(`
        interface SimpleInterface {
          aap: string
          noot?: number
          mies: boolean
        }

        function test(): SimpleInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "member",
            name: "aap",
            optional: false,
            parser: { type: "string" },
          },
          {
            type: "member",
            name: "noot",
            optional: true,
            parser: { type: "number" },
          },
          {
            type: "member",
            name: "mies",
            optional: false,
            parser: { type: "boolean" },
          },
        ],
      },
      deps: {},
    })
  })
})
