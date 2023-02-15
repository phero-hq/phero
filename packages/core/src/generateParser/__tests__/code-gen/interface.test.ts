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
      deps: {
        AapParser: 'ObjectLiteralParser(["aap", false, NumberParser])',
        InterfaceWithRefParser:
          'ObjectLiteralParser(["aap", false, AapParser], ["noot", true, NootParser])',
        NootParser: 'ObjectLiteralParser(["noot", false, NumberParser])',
      },
      output: "InterfaceWithRefParser",
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
      deps: {
        RecursiveInterfaceParser:
          'ObjectLiteralParser(["recur", true, RecursiveInterfaceParser])',
      },
      output: "RecursiveInterfaceParser",
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
      deps: {
        BaseParser: 'ObjectLiteralParser(["base", false, StringParser])',
        TheInterfaceParser:
          'IntersectionParser(ObjectLiteralParser(["prop", false, StringParser]), BaseParser)',
      },
      output: "TheInterfaceParser",
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
      deps: {
        RootParser: 'ObjectLiteralParser(["root", false, StringParser])',
        BaseParser:
          'IntersectionParser(ObjectLiteralParser(["base", false, StringParser]), RootParser)',
        TheInterfaceParser:
          'IntersectionParser(ObjectLiteralParser(["prop", false, StringParser]), BaseParser)',
      },
      output: "TheInterfaceParser",
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
