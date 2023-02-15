import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("indexedAccess", () => {
  test("by prop name", () => {
    const modelMap = generateParserModelForReturnType(`
      type Person = { age: number; name: string; alive: boolean };
      type MyIndexedAccess = Person["age"];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: { type: "reference", typeName: "MyIndexedAccess" },
      deps: {
        MyIndexedAccess: {
          type: "number",
        },
      },
    })
  })
  test("by prop name with union", () => {
    const modelMap = generateParserModelForReturnType(`
      type Person = { age: number; name: string; alive: boolean };
      type MyIndexedAccess = Person["age" | "name"];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: { type: "reference", typeName: "MyIndexedAccess" },
      deps: {
        MyIndexedAccess: {
          type: "union",
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
      },
    })
  })
  test("by keyof of props", () => {
    const modelMap = generateParserModelForReturnType(`
      type Person = { age: number; name: string; alive: boolean };
      type MyIndexedAccess = Person[keyof Person];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: { type: "reference", typeName: "MyIndexedAccess" },
      deps: {
        MyIndexedAccess: {
          type: "union",
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
            {
              type: "boolean",
            },
          ],
        },
      },
    })
  })
  test("by indirect union from other type", () => {
    const modelMap = generateParserModelForReturnType(`
      type Person = { age: number; name: string; alive: boolean };
      type AliveOrName = "alive" | "name";
      type MyIndexedAccess = Person[AliveOrName];
      function test(): MyIndexedAccess { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: { type: "reference", typeName: "MyIndexedAccess" },
      deps: {
        MyIndexedAccess: {
          type: "union",
          oneOf: [
            {
              type: "string",
            },
            {
              type: "boolean",
            },
          ],
        },
      },
    })
  })
  test("complex example", () => {
    const modelMap = generateParserModelForReturnType(`
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
    expect(modelMap).toEqual({
      root: { type: "reference", typeName: "MyIndexedAccess" },
      deps: {
        MyIndexedAccess: {
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
            {
              type: "member",
              name: "noot",
              optional: false,
              parser: {
                type: "string",
              },
            },
            {
              type: "member",
              name: "mies",
              optional: false,
              parser: {
                type: "boolean",
              },
            },
          ],
        },
      },
    })
  })
})
