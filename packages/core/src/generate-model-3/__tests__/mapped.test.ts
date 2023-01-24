import { generateParserModelMap } from "../../lib/tsTestUtils"

type Aad = {
  kaas: string
  koos: string
}

describe("mapped", () => {
  test("MyMappedType keyof 1 key", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
      }
      type MyMappedType = keyof Aad
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "string-literal",
          literal: "kaas",
        },
      },
    })
  })
  test("MyMappedType keyof multiple keys", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
        aap: string
      }
      type MyMappedType = keyof Aad
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "union",
          oneOf: [
            {
              type: "string-literal",
              literal: "kaas",
            },
            {
              type: "string-literal",
              literal: "aap",
            },
          ],
        },
      },
    })
  })
  test("MyMappedType keyof as type parameter", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
      }
      type Bug<X> = X
      type MyMappedType = Bug<keyof Aad>
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "reference",
          typeName: 'Bug<"kaas">',
          typeArguments: [
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
        },
        'Bug<"kaas">': {
          type: "generic",
          typeName: 'Bug<"kaas">',
          typeArguments: [
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
          parser: {
            type: "string-literal",
            literal: "kaas",
          },
        },
      },
    })
  })
  test.only("MyMappedType keyof as default parameter", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
      }
      type Bug<X, Y = keyof X> = Y
      type MyMappedType = Bug<Aad>
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "reference",
          typeName: 'Bug<Aad, "kaas">',
          typeArguments: [
            {
              type: "reference",
              typeName: "Aad",
            },
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
        },
        'Bug<Aad, "kaas">': {
          type: "generic",
          typeName: 'Bug<Aad, "kaas">',
          typeArguments: [
            {
              type: "reference",
              typeName: "Aad",
            },
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
          parser: {
            type: "string-literal",
            literal: "kaas",
          },
        },
      },
    })
  })
  test("Exclude", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
        koos: string
      }
      
      type MyMappedType = Exclude<keyof Aad, "koos">
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "reference",
          typeName: 'Exclude<keyof Aad, "koos">',
          typeArguments: [
            {
              type: "union",
              oneOf: [
                {
                  type: "string-literal",
                  literal: "kaas",
                },
                {
                  type: "string-literal",
                  literal: "koos",
                },
              ],
            },
            {
              type: "string-literal",
              literal: "koos",
            },
          ],
        },
        'Exclude<keyof Aad, "koos">': {
          type: "generic",
          typeName: 'Exclude<keyof Aad, "koos">',
          typeArguments: [
            {
              type: "union",
              oneOf: [
                {
                  type: "string-literal",
                  literal: "kaas",
                },
                {
                  type: "string-literal",
                  literal: "koos",
                },
              ],
            },
            {
              type: "string-literal",
              literal: "koos",
            },
          ],
          parser: {
            type: "string-literal",
            literal: "kaas",
          },
        },
      },
    })
  })
  test("Pick", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
        koos: string
      }
      
      type MyMappedType = Pick<Aad, "kaas">
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "object",
          members: [
            {
              type: "member",
              name: "kaas",
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

  test.skip("MyMappedType = Omit", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
        koos: string
      }
      
      type MyMappedType = Omit<Aad, "kaas">
      function test(): MyMappedType { throw new Error() }
      
      // type X = "aap" | "noot"
      // type MyMappedType<T> = Exclude<T, Exclude<T, "aap">>
      // function test(): MyMappedType<X> { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "reference",
          typeName: 'Bug<"kaas">',
          typeArguments: [
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
        },
        'Bug<"kaas">': {
          type: "generic",
          typeName: 'Bug<"kaas">',
          typeArguments: [
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
          parser: {
            type: "string-literal",
            literal: "kaas",
          },
        },
      },
    })
  })

  test.skip("Omit", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas: string
        koos: string
      }

      type MyMappedType = Omit<Aad, "koos">
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "reference",
          typeName: 'Omit<Aad, "kaas">',
          typeArguments: [
            {
              type: "reference",
              typeName: "Aad",
            },
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
        },
        'Omit<Aad, "kaas">': {
          type: "generic",
          typeName: 'Omit<Aad, "kaas">',
          typeArguments: [
            {
              type: "reference",
              typeName: "Aad",
            },
            {
              type: "string-literal",
              literal: "kaas",
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "kaas",
                optional: false,
                parser: {
                  type: "string",
                },
              },
            ],
          },
        },
      },
    })
  })
  test.skip("MyMappedType", () => {
    const modelMap = generateParserModelMap(`
      type T = {
        a: string
        b: string
      }
      type MyMappedType = Pick<T, Exclude<keyof T, "b">>;
  
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "object",
          members: [
            {
              type: "member",
              name: "a",
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

  test.skip("Pick recursive", () => {
    const modelMap = generateParserModelMap(`
      type Aad = {
        kaas?: Aad
        koos: string
      }
      
      type MyMappedType = Pick<Aad, "kaas">
      
      function test(): MyMappedType { throw new Error() }
    `)

    console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyMappedType",
      },
      deps: {
        MyMappedType: {
          type: "object",
          members: [
            {
              type: "member",
              name: "kaas",
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
})

// MET JASPER:
// // MyDeepConditionalRecursiveType<number>

// const MyDeepConditionalRecursiveType_number_Parser = {
//   prop: Wrap_number_boolean_Parser
// }

// const Wrap_number_boolean_Parser = {
//   w: NumberParser,
//   b: BooleanParser,
//   recursive: MyDeepConditionalRecursiveType_boolean_Parser,
// }

// const MyDeepConditionalRecursiveType_boolean_Parser = {
//   prop: Wrap_boolean_boolean_Parser
// }

// const Wrap_boolean_boolean_Parser = {
//   w: BooleanParser,
//   b: BooleanParser,
//   recursive: MyDeepConditionalRecursiveType_boolean_Parser,
// }

// // MyDeepConditionalRecursiveType<string>

// const MyDeepConditionalRecursiveType_string_Parser = {
//   prop: Wrap_string_number_Parser
// }

// const Wrap_string_number_Parser = {
//   w: StringParser,
//   b: NumberParser,
//   recursive: MyDeepConditionalRecursiveType_number_Parser,
// }
