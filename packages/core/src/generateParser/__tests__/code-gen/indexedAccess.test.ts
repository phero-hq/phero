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
      input: "ObjectLiteralParser()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser: "NumberParser",
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
      input: "ObjectLiteralParser()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser: "UnionParser(StringParser, NumberParser)",
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
      input: "ObjectLiteralParser()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser:
          "UnionParser(StringParser, NumberParser, BooleanParser)",
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
      input: "ObjectLiteralParser()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser: "UnionParser(StringParser, BooleanParser)",
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
      input: "ObjectLiteralParser()",
      output: "MyIndexedAccessParser",
      deps: {
        MyIndexedAccessParser:
          'ObjectLiteralParser(["aap", false, NumberParser], ["noot", false, StringParser], ["mies", false, BooleanParser])',
      },
    })
  })
})
