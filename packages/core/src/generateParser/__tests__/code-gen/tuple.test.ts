import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("tuple", () => {
  test(`[string, string]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [string, string] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser([StringParser], [StringParser])`,
    )
  })
  test(`[string, 123, boolean]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [string, 123, boolean] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser([StringParser], [NumberLiteralParser(123)], [BooleanParser])`,
    )
  })
  test(`["aap"]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): ["aap"] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`TupleParser([StringLiteralParser("aap")])`)
  })
  test(`[123 | "str", number]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [123 | "str", number] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser([UnionParser(NumberLiteralParser(123), StringLiteralParser("str"))], [NumberParser])`,
    )
  })
  test(`[string, X]`, () => {
    const parsers = generateParsersForFunction(`
      type X = number

      function test(): [string, X] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`TupleParser([StringParser], [XParser])`)
  })
  test(`[string, ...number[]]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...number[]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [NumberParser, true])`,
      },
    })
  })
  test(`[string, ...number[], boolean]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...number[], boolean]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [NumberParser, true], [BooleanParser])`,
      },
    })
  })
  test(`[string, ...number[][]]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...number[][]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [ArrayParser(NumberParser), true])`,
      },
    })
  })
  test(`[string, ...Array<number>]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...Array<number>]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [NumberParser, true])`,
      },
    })
  })
  test(`[string, ...Array<number>, boolean]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...Array<number>, boolean]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [NumberParser, true], [BooleanParser])`,
      },
    })
  })
  test(`[string, ...Array<Array<number>>]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...Array<Array<number>>]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [ArrayParser(NumberParser), true])`,
      },
    })
  })
  test(`[string, ...[string, number]]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...[string, number]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [StringParser], [NumberParser])`,
      },
    })
  })
  test(`[string, ...Y]`, () => {
    const parsers = generateParsersForFunction(`
      type Y = [number, string]
      type X = [string, ...Y]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [YParser, true])`,
        YParser: `TupleParser([NumberParser], [StringParser])`,
      },
    })
  })
  test(`[string, ...Y<string>]`, () => {
    const parsers = generateParsersForFunction(`
      type Y<T, A = T extends string ? number : boolean> = [T, A]
      
      type X = [number, ...Y<string>]
      
      
      function test(): X { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: "XParser",
      deps: {
        XParser: "TupleParser([NumberParser], [ref_1, true])",
        ref_1: "TupleParser([StringParser], [NumberParser])",
      },
    })
  })
  test(`[lat: number, long: number]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [lat: number, long: number]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([NumberParser], [NumberParser])`,
      },
    })
  })
  test(`[myString: string, ...myNumber: number[]]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [myString: string, ...myNumber: number[]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [NumberParser, true])`,
      },
    })
  })
  test(`[myString: string, ...myNumber: Array<number>]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [myString: string, ...myNumber: Array<number>]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [NumberParser, true])`,
      },
    })
  })
  test(`[myString: string, ...myNumber: Y]`, () => {
    const parsers = generateParsersForFunction(`
      type Y = [a: string, b: boolean]
      type X = [myString: string, ...myTuple: Y]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([StringParser], [YParser, true])`,
        YParser: `TupleParser([StringParser], [BooleanParser])`,
      },
    })
  })
  test(`Parameters<typeof fn>`, () => {
    const parsers = generateParsersForFunction(`
      function test(): X { throw new Error() }
      
      type X = Parameters<typeof fn>  
      function fn(lng: number, lat: number) {}
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "ObjectLiteralParser()",
      output: `XParser`,
      deps: {
        XParser: `TupleParser([NumberParser], [NumberParser])`,
      },
    })
  })
})
