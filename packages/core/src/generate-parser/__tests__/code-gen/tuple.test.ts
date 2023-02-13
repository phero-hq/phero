import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("tuple", () => {
  test(`[string, string]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [string, string] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser({ parser: StringParser }, { parser: StringParser })`,
    )
  })
  test(`[string, 123, boolean]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [string, 123, boolean] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser({ parser: StringParser }, { parser: NumberLiteralParser(123) }, { parser: BooleanParser })`,
    )
  })
  test(`["aap"]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): ["aap"] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser({ parser: StringLiteralParser("aap") })`,
    )
  })
  test(`[123 | "str", number]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [123 | "str", number] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser({ parser: UnionParser(NumberLiteralParser(123), StringLiteralParser("str")) }, { parser: NumberParser })`,
    )
  })
  test(`[string, X]`, () => {
    const parsers = generateParsersForFunction(`
      type X = number

      function test(): [string, X] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `TupleParser({ parser: StringParser }, { parser: XParser })`,
    )
  })
  test(`[string, ...number[]]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...number[]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: NumberParser, rest: true })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: NumberParser, rest: true }, { parser: BooleanParser })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: ArrayParser(NumberParser), rest: true })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: NumberParser, rest: true })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: NumberParser, rest: true }, { parser: BooleanParser })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: ArrayParser(NumberParser), rest: true })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: StringParser }, { parser: NumberParser })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: YParser, rest: true })`,
        YParser: `TupleParser({ parser: NumberParser }, { parser: StringParser })`,
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
      output: "XParser",
      deps: {
        XParser:
          "TupleParser({ parser: NumberParser }, { parser: ref_1, rest: true })",
        ref_1:
          "TupleParser({ parser: StringParser }, { parser: NumberParser })",
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: NumberParser }, { parser: NumberParser })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: NumberParser, rest: true })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: NumberParser, rest: true })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: StringParser }, { parser: YParser, rest: true })`,
        YParser: `TupleParser({ parser: StringParser }, { parser: BooleanParser })`,
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
      output: `XParser`,
      deps: {
        XParser: `TupleParser({ parser: NumberParser }, { parser: NumberParser })`,
      },
    })
  })
})
