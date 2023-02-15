import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("interface", () => {
  test(`SimpleInterface`, () => {
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
    const modelMap = generateParserModelForReturnType(`
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
  test(`interface with parent interface`, () => {
    const modelMap = generateParserModelForReturnType(`
        interface Base {
          base: string
        }
        interface TheInterface extends Base {
          prop: string
        }

        function test(): TheInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "TheInterface",
      },
      deps: {
        TheInterface: {
          type: "intersection",
          parsers: [
            {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "prop",
                  optional: false,
                  parser: {
                    type: "string",
                  },
                },
              ],
            },
            {
              type: "reference",
              typeName: "Base",
            },
          ],
        },
        Base: {
          type: "object",
          members: [
            {
              type: "member",
              name: "base",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
      },
    })
  })
  test(`interface with ancestor interface`, () => {
    const modelMap = generateParserModelForReturnType(`
        interface Root {
          root: string
        }
        interface Base extends Root {
          base: string
        }
        interface TheInterface extends Base {
          prop: string
        }

        function test(): TheInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "TheInterface",
      },
      deps: {
        TheInterface: {
          type: "intersection",
          parsers: [
            {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "prop",
                  optional: false,
                  parser: {
                    type: "string",
                  },
                },
              ],
            },
            {
              type: "reference",
              typeName: "Base",
            },
          ],
        },
        Base: {
          type: "intersection",
          parsers: [
            {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "base",
                  optional: false,
                  parser: {
                    type: "string",
                  },
                },
              ],
            },
            {
              type: "reference",
              typeName: "Root",
            },
          ],
        },
        Root: {
          type: "object",
          members: [
            {
              type: "member",
              name: "root",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
      },
    })
  })
  test(`interface with multiple heritage clauses`, () => {
    const modelMap = generateParserModelForReturnType(`
        type Other<T> {
          other: T
        }
        interface Base {
          base: string
        }
        interface TheInterface extends Base, Other<string> {
          prop: string
        }

        function test(): TheInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "TheInterface",
      },
      deps: {
        "Other<string>": {
          type: "generic",
          typeName: "Other<string>",
          typeArguments: [{ type: "string" }],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "other",
                optional: false,
                parser: {
                  type: "string",
                },
              },
            ],
          },
        },
        Base: {
          type: "object",
          members: [
            {
              type: "member",
              name: "base",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
        TheInterface: {
          type: "intersection",
          parsers: [
            {
              type: "object",
              members: [
                {
                  type: "member",
                  name: "prop",
                  optional: false,
                  parser: {
                    type: "string",
                  },
                },
              ],
            },
            {
              type: "reference",
              typeName: "Base",
            },
            {
              type: "reference",
              typeName: "Other<string>",
              typeArguments: [{ type: "string" }],
            },
          ],
        },
      },
    })
  })
})
