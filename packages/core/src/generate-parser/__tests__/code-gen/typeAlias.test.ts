import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("typeAlias", () => {
  test(`type X = string`, () => {
    const parsers = generateParsersForFunction(`
        type X = string

        function test(): X { throw new Error() }
    `)

    expect(parsers).toEqual({
      deps: {
        XParser: "StringParser",
      },
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
        YParser: "NumberParser",
        XParser: "YParser",
      },
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
        XParser: 'ObjectLiteralParser(["y", false, YParser])',
        YParser: "NumberParser",
      },
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
          'ObjectLiteralParser(["y", false, UnionParser(YParser, ZParser)])',
        YParser: "NumberParser",
        ZParser: "BooleanParser",
      },
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
        XParser: "TupleParser([StringParser], [YParser])",
        YParser: "NumberParser",
      },
      output: "XParser",
    })
  })
})
