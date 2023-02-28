import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("tuple", () => {
  test(`[string, string]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [string, string] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Tuple([parser.String], [parser.String])`,
    )
  })
  test(`[string, 123, boolean]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [string, 123, boolean] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Tuple([parser.String], [parser.NumberLiteral(123)], [parser.Boolean])`,
    )
  })
  test(`["aap"]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): ["aap"] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Tuple([parser.StringLiteral("aap")])`,
    )
  })
  test(`[123 | "str", number]`, () => {
    const parsers = generateParsersForFunction(`
        function test(): [123 | "str", number] { throw new Error() }
    `)

    expect(parsers.output).toEqual(
      `parser.Tuple([parser.Union(parser.NumberLiteral(123), parser.StringLiteral("str"))], [parser.Number])`,
    )
  })
  test(`[string, X]`, () => {
    const parsers = generateParsersForFunction(`
      type X = number

      function test(): [string, X] { throw new Error() }
    `)

    expect(parsers.output).toEqual(`parser.Tuple([parser.String], [XParser])`)
  })
  test(`[string, ...number[]]`, () => {
    const parsers = generateParsersForFunction(`
      type X = [string, ...number[]]
      
      function test(): X { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Number, true])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Number, true], [parser.Boolean])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Array(parser.Number), true])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Number, true])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Number, true], [parser.Boolean])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Array(parser.Number), true])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.String], [parser.Number])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [YParser, true])`,
        YParser: `parser.Tuple([parser.Number], [parser.String])`,
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
      input: "parser.ObjectLiteral()",
      output: "XParser",
      deps: {
        XParser: "parser.Tuple([parser.Number], [ref_0, true])",
        ref_0: "parser.Tuple([parser.String], [parser.Number])",
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.Number], [parser.Number])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Number, true])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [parser.Number, true])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.String], [YParser, true])`,
        YParser: `parser.Tuple([parser.String], [parser.Boolean])`,
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
      input: "parser.ObjectLiteral()",
      output: `XParser`,
      deps: {
        XParser: `parser.Tuple([parser.Number], [parser.Number])`,
      },
    })
  })
})
