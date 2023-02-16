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
        MyMappedTypeParser: 'StringLiteralParser("kaas")',
      },
      input: "ObjectLiteralParser()",
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
          'UnionParser(StringLiteralParser("Aap"), StringLiteralParser("Noot"), StringLiteralParser("Mies"))',
      },
      input: "ObjectLiteralParser()",
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
          'UnionParser(StringLiteralParser("aap"), StringLiteralParser("noot"), StringLiteralParser("mies"))',
      },
      input: "ObjectLiteralParser()",
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
        MyMappedTypeParser: 'StringLiteralParser("kaas")',
      },
      input: "ObjectLiteralParser()",
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
          'UnionParser(StringLiteralParser("kaas"), StringLiteralParser("aap"))',
      },
      input: "ObjectLiteralParser()",
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
        MyMappedTypeParser: "ref_1",
        ref_1: 'StringLiteralParser("kaas")',
      },
      input: "ObjectLiteralParser()",
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
        AadParser: 'ObjectLiteralParser(["kaas", false, StringParser])',
        MyMappedTypeParser: "ref_2",
        ref_2: 'ObjectLiteralParser(["y", false, StringLiteralParser("kaas")])',
      },
      input: "ObjectLiteralParser()",
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
      deps: {
        MyMappedTypeParser: 'StringLiteralParser("kaas")',
      },
      input: "ObjectLiteralParser()",
      output: "MyMappedTypeParser",
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
          'ObjectLiteralParser(["kaas", false, StringParser])',
      },
      input: "ObjectLiteralParser()",
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
          'ObjectLiteralParser(["kaas", false, StringParser])',
      },
      input: "ObjectLiteralParser()",
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
        MyMappedTypeParser: 'ObjectLiteralParser(["a", false, StringParser])',
      },
      input: "ObjectLiteralParser()",
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
          'ObjectLiteralParser(["kaas", true, AadParser], ["koos", false, StringParser])',
        MyMappedTypeParser: 'ObjectLiteralParser(["kaas", true, AadParser])',
      },
      input: "ObjectLiteralParser()",
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
          'ObjectLiteralParser(["a", false, UnionParser(StringParser, NumberParser)], ["b", false, UnionParser(StringParser, NumberParser)])',
      },
      input: "ObjectLiteralParser()",
      output: "MyMappedTypeParser",
    })
  })
})
