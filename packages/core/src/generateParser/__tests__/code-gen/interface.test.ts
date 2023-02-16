import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("interface", () => {
  test(`SimpleInterface`, () => {
    const parsers = generateParsersForFunction(`
        interface SimpleInterface {
          aap: string
          noot?: number
          mies: boolean
        }

        function test(): SimpleInterface { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `SimpleInterfaceParser`,
      deps: {
        SimpleInterfaceParser: `ObjectLiteralParser(["aap", false, StringParser], ["noot", true, NumberParser], ["mies", false, BooleanParser])`,
      },
    })
  })
  test(`InterfaceWithRef`, () => {
    const parsers = generateParsersForFunction(`
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

    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: "InterfaceWithRefParser",
      deps: {
        AapParser: 'ObjectLiteralParser(["aap", false, NumberParser])',
        InterfaceWithRefParser:
          'ObjectLiteralParser(["aap", false, AapParser], ["noot", true, NootParser])',
        NootParser: 'ObjectLiteralParser(["noot", false, NumberParser])',
      },
    })
  })
  test(`RecursiveInterface`, () => {
    const parsers = generateParsersForFunction(`
        interface RecursiveInterface {
          recur?: RecursiveInterface
        }

        function test(): RecursiveInterface { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: "RecursiveInterfaceParser",
      deps: {
        RecursiveInterfaceParser:
          'ObjectLiteralParser(["recur", true, RecursiveInterfaceParser])',
      },
    })
  })
  test(`interface with parent interface`, () => {
    const parsers = generateParsersForFunction(`
        interface Base {
          base: string
        }
        interface TheInterface extends Base {
          prop: string
        }

        function test(): TheInterface { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: "TheInterfaceParser",
      deps: {
        BaseParser: 'ObjectLiteralParser(["base", false, StringParser])',
        TheInterfaceParser:
          'IntersectionParser(ObjectLiteralParser(["prop", false, StringParser]), BaseParser)',
      },
    })
  })
  test(`interface with ancestor interface`, () => {
    const parsers = generateParsersForFunction(`
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

    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: "TheInterfaceParser",
      deps: {
        RootParser: 'ObjectLiteralParser(["root", false, StringParser])',
        BaseParser:
          'IntersectionParser(ObjectLiteralParser(["base", false, StringParser]), RootParser)',
        TheInterfaceParser:
          'IntersectionParser(ObjectLiteralParser(["prop", false, StringParser]), BaseParser)',
      },
    })
  })
  test(`interface with multiple heritage clauses`, () => {
    const parsers = generateParsersForFunction(`
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

    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: "TheInterfaceParser",
      deps: {
        TheInterfaceParser:
          'IntersectionParser(ObjectLiteralParser(["prop", false, StringParser]), BaseParser, ref_2)',
        BaseParser: 'ObjectLiteralParser(["base", false, StringParser])',
        ref_2: 'ObjectLiteralParser(["other", false, StringParser])',
      },
    })
  })
})
