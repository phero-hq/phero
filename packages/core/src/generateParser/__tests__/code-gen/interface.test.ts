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
      input: "parser.ObjectLiteral()",
      output: `SimpleInterfaceParser`,
      deps: {
        SimpleInterfaceParser: `parser.ObjectLiteral(["aap", false, parser.String], ["noot", true, parser.Number], ["mies", false, parser.Boolean])`,
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
      input: "parser.ObjectLiteral()",
      output: "InterfaceWithRefParser",
      deps: {
        AapParser: 'parser.ObjectLiteral(["aap", false, parser.Number])',
        InterfaceWithRefParser:
          'parser.ObjectLiteral(["aap", false, AapParser], ["noot", true, NootParser])',
        NootParser: 'parser.ObjectLiteral(["noot", false, parser.Number])',
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
      input: "parser.ObjectLiteral()",
      output: "RecursiveInterfaceParser",
      deps: {
        RecursiveInterfaceParser:
          'parser.ObjectLiteral(["recur", true, RecursiveInterfaceParser])',
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
      input: "parser.ObjectLiteral()",
      output: "TheInterfaceParser",
      deps: {
        BaseParser: 'parser.ObjectLiteral(["base", false, parser.String])',
        TheInterfaceParser:
          'parser.Intersection(parser.ObjectLiteral(["prop", false, parser.String]), BaseParser)',
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
      input: "parser.ObjectLiteral()",
      output: "TheInterfaceParser",
      deps: {
        RootParser: 'parser.ObjectLiteral(["root", false, parser.String])',
        BaseParser:
          'parser.Intersection(parser.ObjectLiteral(["base", false, parser.String]), RootParser)',
        TheInterfaceParser:
          'parser.Intersection(parser.ObjectLiteral(["prop", false, parser.String]), BaseParser)',
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
      input: "parser.ObjectLiteral()",
      output: "TheInterfaceParser",
      deps: {
        TheInterfaceParser:
          'parser.Intersection(parser.ObjectLiteral(["prop", false, parser.String]), BaseParser, ref_0)',
        BaseParser: 'parser.ObjectLiteral(["base", false, parser.String])',
        ref_0: 'parser.ObjectLiteral(["other", false, parser.String])',
      },
    })
  })
})
