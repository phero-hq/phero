import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("typeAlias", () => {
  test(`type X = string`, () => {
    const parsers = generateParsersForFunction(`
        type X = string

        function test(): X { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        XParser: "parser.String",
      },
      input: "parser.ObjectLiteral()",
      output: "XParser",
    })
  })
  test(`type X = Y`, () => {
    const parsers = generateParsersForFunction(`
      type Y = number  
      type X = Y

      function test(): X { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        YParser: "parser.Number",
        XParser: "YParser",
      },
      input: "parser.ObjectLiteral()",
      output: "XParser",
    })
  })
  test(`type X = { y: Y }`, () => {
    const parsers = generateParsersForFunction(`
      type Y = number  
      type X = { y: Y }

      function test(): X { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        XParser: 'parser.ObjectLiteral(["y", false, YParser])',
        YParser: "parser.Number",
      },
      input: "parser.ObjectLiteral()",
      output: "XParser",
    })
  })
  test(`type X = { y: Y | Z }`, () => {
    const parsers = generateParsersForFunction(`
      type Z = boolean
      type Y = number  
      type X = { y: Y | Z }

      function test(): X { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        XParser:
          'parser.ObjectLiteral(["y", false, parser.Union(YParser, ZParser)])',
        YParser: "parser.Number",
        ZParser: "parser.Boolean",
      },
      input: "parser.ObjectLiteral()",
      output: "XParser",
    })
  })
  test(`type X = [string, Y]`, () => {
    const parsers = generateParsersForFunction(`
      type Y = number
      type X = [string, Y]

      function test(): X { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        XParser: "parser.Tuple([parser.String], [YParser])",
        YParser: "parser.Number",
      },
      input: "parser.ObjectLiteral()",
      output: "XParser",
    })
  })
})
