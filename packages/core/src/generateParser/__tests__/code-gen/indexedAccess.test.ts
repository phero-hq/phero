import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("indexedAccess", () => {
  test("by prop name", () => {
    const parsers = generateParsersForFunction(`
      type Person = { age: number; name: string; alive: boolean };
      type MyIndexedAccess = Person["age"];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser: "parser.Number",
      },
    })
  })
  test("by prop name with union", () => {
    const parsers = generateParsersForFunction(`
      type Person = { age: number; name: string; alive: boolean };
      type MyIndexedAccess = Person["age" | "name"];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser: "parser.Union(parser.String, parser.Number)",
      },
    })
  })
  test("by keyof of props", () => {
    const parsers = generateParsersForFunction(`
      type Person = { age: number; name: string; alive: boolean };
      type MyIndexedAccess = Person[keyof Person];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser:
          "parser.Union(parser.String, parser.Number, parser.Boolean)",
      },
    })
  })
  test("by indirect union from other type", () => {
    const parsers = generateParsersForFunction(`
      type Person = { age: number; name: string; alive: boolean };
      type AliveOrName = "alive" | "name";
      type MyIndexedAccess = Person[AliveOrName];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser: "parser.Union(parser.String, parser.Boolean)",
      },
    })
  })
  test("complex example", () => {
    const parsers = generateParsersForFunction(`
      type Aap = {
        aap: number
        noot: string
        mies: boolean
      }
      type Kaas = {
        aap: Aap
      }  
      type MyIndexedAccess = Kaas["aap"]
    
    function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser:
          'parser.ObjectLiteral(["aap", false, parser.Number], ["noot", false, parser.String], ["mies", false, parser.Boolean])',
      },
    })
  })
})
