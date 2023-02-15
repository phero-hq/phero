import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("indexSignature", () => {
  test("MyIndexSignature number", () => {
    const parsers = generateParsersForFunction(`

      function test(): {
        [key: string]: string | number;
      } { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers.output).toEqual(
      `ObjectLiteralParser([StringParser, false, UnionParser(StringParser, NumberParser)])`,
    )
  })
  test("MyIndexSignature number", () => {
    const parsers = generateParsersForFunction(`
      type MyIndexSignature = {
        [key: string]: string | number;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(parsers).toEqual({
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `ObjectLiteralParser([StringParser, false, UnionParser(StringParser, NumberParser)])`,
      },
    })
  })
  test("MyIndexSignature string", () => {
    const parsers = generateParsersForFunction(`
      type MyIndexSignature = {
        [index: number]: string;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(parsers).toEqual({
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `ObjectLiteralParser([NumberKeyParser, false, StringParser])`,
      },
    })
  })
  test("MyIndexSignature string and number", () => {
    const parsers = generateParsersForFunction(`
      type MyIndexSignature = {
        [key: string]: string | number;
        [index: number]: string;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(parsers).toEqual({
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `ObjectLiteralParser([StringParser, false, UnionParser(StringParser, NumberParser)], [NumberKeyParser, false, StringParser])`,
      },
    })
  })
  test("MyIndexSignature string and number + prop", () => {
    const parsers = generateParsersForFunction(`
      type MyIndexSignature = {
        [key: string]: string | number;
        [index: number]: string;
        length: number;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(parsers).toEqual({
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `ObjectLiteralParser([StringParser, false, UnionParser(StringParser, NumberParser)], [NumberKeyParser, false, StringParser], ["length", false, NumberParser])`,
      },
    })
  })
  test("MyIndexSignature number", () => {
    const parsers = generateParsersForFunction(`
      type MyIndexSignature = {
        [key: string]: string | number;
        [key: number]: number;
      };

      type MyConditional<T, K = T extends string ? string : MyIndexSignature> = {
        test: K
      }

      function test(): MyConditional<number> { throw new Error() }
    `)

    expect(parsers).toEqual({
      output: "ref_0",
      deps: {
        ref_0:
          'ObjectLiteralParser(["test", false, ObjectLiteralParser([StringParser, false, UnionParser(StringParser, NumberParser)], [NumberKeyParser, false, NumberParser])])',
      },
    })
  })
  test("MyIndexSignatureInterface string and number + prop", () => {
    const parsers = generateParsersForFunction(`
      interface MyIndexSignature {
        [key: string]: string | number;
        [index: number]: string;
        length: number;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(parsers).toEqual({
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `ObjectLiteralParser([StringParser, false, UnionParser(StringParser, NumberParser)], [NumberKeyParser, false, StringParser], ["length", false, NumberParser])`,
      },
    })
  })
})
