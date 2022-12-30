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
        type: "reference",
        typeName: "SimpleInterface",
      },
      deps: {
        SimpleInterface: {
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
      },
    })
  })
  test(`InterfaceWithRef`, () => {
    const modelMap = generateParserModelMap(`
        interface InterfaceWithRef {
          aap: Aap
          noot?: Noot
        }

        interface Aap {
          aap: number
        }
        
        interface Noot {
          noot: number
        }

        function test(): InterfaceWithRef { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "InterfaceWithRef",
      },
      deps: {
        InterfaceWithRef: {
          type: "object",
          members: [
            {
              type: "member",
              name: "aap",
              optional: false,
              parser: {
                type: "reference",
                typeName: "Aap",
              },
            },
            {
              type: "member",
              name: "noot",
              optional: true,
              parser: { type: "reference", typeName: "Noot" },
            },
          ],
        },
        Aap: {
          type: "object",
          members: [
            {
              type: "member",
              name: "aap",
              optional: false,
              parser: {
                type: "number",
              },
            },
          ],
        },
        Noot: {
          type: "object",
          members: [
            {
              type: "member",
              name: "noot",
              optional: false,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test(`RecursiveInterface`, () => {
    const modelMap = generateParserModelMap(`
        interface RecursiveInterface {
          recur?: RecursiveInterface
        }

        function test(): RecursiveInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "RecursiveInterface",
      },
      deps: {
        RecursiveInterface: {
          type: "object",
          members: [
            {
              type: "member",
              name: "recur",
              optional: true,
              parser: {
                type: "reference",
                typeName: "RecursiveInterface",
              },
            },
          ],
        },
      },
    })
  })
})
