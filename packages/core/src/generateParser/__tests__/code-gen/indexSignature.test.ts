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
      `parser.ObjectLiteral([parser.String, false, parser.Union(parser.String, parser.Number)])`,
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
      input: "parser.ObjectLiteral()",
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `parser.ObjectLiteral([parser.String, false, parser.Union(parser.String, parser.Number)])`,
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
      input: "parser.ObjectLiteral()",
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `parser.ObjectLiteral([parser.NumberKey, false, parser.String])`,
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
      input: "parser.ObjectLiteral()",
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `parser.ObjectLiteral([parser.String, false, parser.Union(parser.String, parser.Number)], [parser.NumberKey, false, parser.String])`,
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
      input: "parser.ObjectLiteral()",
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `parser.ObjectLiteral([parser.String, false, parser.Union(parser.String, parser.Number)], [parser.NumberKey, false, parser.String], ["length", false, parser.Number])`,
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
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0:
          'parser.ObjectLiteral(["test", false, parser.ObjectLiteral([parser.String, false, parser.Union(parser.String, parser.Number)], [parser.NumberKey, false, parser.Number])])',
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
      input: "parser.ObjectLiteral()",
      output: `MyIndexSignatureParser`,
      deps: {
        MyIndexSignatureParser: `parser.ObjectLiteral([parser.String, false, parser.Union(parser.String, parser.Number)], [parser.NumberKey, false, parser.String], ["length", false, parser.Number])`,
      },
    })
  })
})
