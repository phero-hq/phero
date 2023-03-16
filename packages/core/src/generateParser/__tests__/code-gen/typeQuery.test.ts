import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("typeQuery", () => {
  test(`typeof {} as const`, () => {
    const parsers = generateParsersForFunction(`
      const myConst = {
        a: [1, 2],
        b: [3, 4],
      } as const
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ExampleParser",
      deps: {
        ExampleParser:
          'parser.ObjectLiteral(["a", false, parser.Tuple([parser.NumberLiteral(1)], [parser.NumberLiteral(2)])], ["b", false, parser.Tuple([parser.NumberLiteral(3)], [parser.NumberLiteral(4)])])',
      },
    })
  })
  test(`typeof {}`, () => {
    const parsers = generateParsersForFunction(`
      const myConst = {
        a: [1, 2],
        b: [3, 4],
      }
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ExampleParser",
      deps: {
        ExampleParser:
          'parser.ObjectLiteral(["a", false, parser.Array(parser.Number)], ["b", false, parser.Array(parser.Number)])',
      },
    })
  })
  test(`typeof [] as const`, () => {
    const parsers = generateParsersForFunction(`
      const myConst = [
        {
          a: 123
        },
        {
          b: 456,
        }
      ] as const
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ExampleParser",
      deps: {
        ExampleParser:
          'parser.Tuple([parser.ObjectLiteral(["a", false, parser.NumberLiteral(123)])], [parser.ObjectLiteral(["b", false, parser.NumberLiteral(456)])])',
      },
    })
  })
  test(`typeof []`, () => {
    const parsers = generateParsersForFunction(`
      const myConst = [
        {
          a: 123
        },
        {
          b: 456,
        }
      ]
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)
    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ExampleParser",
      deps: {
        ExampleParser:
          'parser.Array(parser.Union(parser.ObjectLiteral(["a", false, parser.NumberLiteral(123)], ["b", true, parser.NumberLiteral(456)]), parser.ObjectLiteral(["b", false, parser.NumberLiteral(456)], ["a", true, parser.NumberLiteral(123)])))',
      },
    })
  })
  test(`typeof "str" as const`, () => {
    const parsers = generateParsersForFunction(`
      const myConst = "str" as const
      
      type Example = typeof myConst
      
      function test(): Example { throw new Error() }
    `)
    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ExampleParser",
      deps: {
        ExampleParser: 'parser.StringLiteral("str")',
      },
    })
  })
  test(`typeof enums`, () => {
    const parsers = generateParsersForFunction(`
      enum Aad {
        Aap = "aap",
        Noot = "noot",
      }

      enum Abc {
        A = "a",
        B = "b",
        C = "c",
        D = "d",
      }

      const myConst = {
        [Aad.Aap]: [
          Abc.A,
          Abc.B,
        ],
        [Aad.Noot]: [
          Abc.C,
          Abc.D,
        ],
      } as const

      export type Example = typeof myConst

      function test(): Example { throw new Error() }
    `)
    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ExampleParser",
      deps: {
        ExampleParser:
          'parser.ObjectLiteral(["aap", false, parser.Tuple([parser.StringLiteral("a")], [parser.StringLiteral("b")])], ["noot", false, parser.Tuple([parser.StringLiteral("c")], [parser.StringLiteral("d")])])',
      },
    })
  })
})
