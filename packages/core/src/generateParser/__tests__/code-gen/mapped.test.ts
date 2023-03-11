import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("mapped", () => {
  test("MyMappedType keyof 1 key of a literal type", () => {
    const parsers = generateParsersForFunction(`
      type MyMappedType = keyof { kaas: string }
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser: 'parser.StringLiteral("kaas")',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
  test("MyMappedType keyof 1 key of an enum", () => {
    const parsers = generateParsersForFunction(`
      enum MyEnum {
        Aap = "aap",
        Noot = "noot",
        Mies = "mies",
      }
      type MyMappedType = keyof typeof MyEnum
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser:
          'parser.Union(parser.StringLiteral("Aap"), parser.StringLiteral("Noot"), parser.StringLiteral("Mies"))',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
  test("MyMappedType keyof 1 key of a class", () => {
    const parsers = generateParsersForFunction(`
      class MyClass {
        aap: string
        noot: boolean
        mies: number
      }
      type MyMappedType = keyof MyClass
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser:
          'parser.Union(parser.StringLiteral("aap"), parser.StringLiteral("noot"), parser.StringLiteral("mies"))',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
  test("MyMappedType keyof 1 key", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        kaas: string
      }

      type MyMappedType = keyof Aad
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser: 'parser.StringLiteral("kaas")',
        AadParser: 'parser.ObjectLiteral(["kaas", false, parser.String])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
  test("MyMappedType keyof multiple keys", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        kaas: string
        aap: string
      }
      type MyMappedType = keyof Aad
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser:
          'parser.Union(parser.StringLiteral("kaas"), parser.StringLiteral("aap"))',
        AadParser:
          'parser.ObjectLiteral(["kaas", false, parser.String], ["aap", false, parser.String])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
  test("MyMappedType keyof as type parameter", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        kaas: string
      }
      type Bug<X> = X
      type MyMappedType = Bug<keyof Aad>
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        AadParser: 'parser.ObjectLiteral(["kaas", false, parser.String])',
        MyMappedTypeParser: "ref_0",
        ref_0: 'parser.StringLiteral("kaas")',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
  test("MyMappedType keyof as default parameter", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
          kaas: string
      }
      type Bug<X, Y = keyof X> = {y:Y}
      type MyMappedType = Bug<Aad>
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        AadParser: 'parser.ObjectLiteral(["kaas", false, parser.String])',
        MyMappedTypeParser: "ref_0",
        ref_0:
          'parser.ObjectLiteral(["y", false, parser.StringLiteral("kaas")])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
  test("Exclude", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        kaas: string
        koos: string
      }
      
      type MyMappedType = Exclude<keyof Aad, "koos">
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {},
      input: "parser.ObjectLiteral()",
      output: `parser.StringLiteral("kaas")`,
    })
  })
  test("Pick", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        kaas: string
        koos: string
      }
      
      type MyMappedType = Pick<Aad, "kaas">
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser:
          'parser.ObjectLiteral(["kaas", false, parser.String])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })

  test("Omit", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        kaas: string
        koos: string
      }
      
      type MyMappedType = Omit<Aad, "koos">
      function test(): MyMappedType { throw new Error() }

    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser:
          'parser.ObjectLiteral(["kaas", false, parser.String])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })

  test("MyMappedType", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        a: string
        b: string
      }
      type MyMappedType = Pick<Aad, Exclude<keyof Aad, "b">>;
  
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser: 'parser.ObjectLiteral(["a", false, parser.String])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })

  test("Pick recursive", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        kaas?: Aad
        koos: string
      }
      
      type MyMappedType = Omit<Aad, "koos">
      
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        AadParser:
          'parser.ObjectLiteral(["kaas", true, AadParser], ["koos", false, parser.String])',
        MyMappedTypeParser: 'parser.ObjectLiteral(["kaas", true, AadParser])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })

  test("MyMappedType", () => {
    const parsers = generateParsersForFunction(`
      type Aad = {
        a: string
        b: string
      }
      type MyMappedType = {
        [key in keyof Aad]: string | number
      }
  
      function test(): MyMappedType { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      deps: {
        MyMappedTypeParser:
          'parser.ObjectLiteral(["a", false, parser.Union(parser.String, parser.Number)], ["b", false, parser.Union(parser.String, parser.Number)])',
      },
      input: "parser.ObjectLiteral()",
      output: "MyMappedTypeParser",
    })
  })
})
