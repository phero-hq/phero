import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("enum", () => {
  test(`StringEnum`, () => {
    const parsers = generateParsersForFunction(`
        enum StringEnum {
          Aap = "aap",
          Noot = "noot",
          Mies = "mies",
        }

        function test(): StringEnum { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `StringEnumParser`,
      deps: {
        StringEnumParser: `parser.Enum("aap", "noot", "mies")`,
      },
    })
  })
  test(`NumberEnum`, () => {
    const parsers = generateParsersForFunction(`
        enum NumberEnum {
          Aap = 0,
          Noot,
          Mies,
        }

        function test(): NumberEnum { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `NumberEnumParser`,
      deps: {
        NumberEnumParser: `parser.Enum(0, 1, 2)`,
      },
    })
  })
  test(`MixedEnum`, () => {
    const parsers = generateParsersForFunction(`
        enum MixedEnum {
          Aap = "x",
          Noot = 0,
          Mies,
        }

        function test(): MixedEnum { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `MixedEnumParser`,
      deps: {
        MixedEnumParser: `parser.Enum("x", 0, 1)`,
      },
    })
  })
  test(`ValuelessEnum`, () => {
    const parsers = generateParsersForFunction(`
        enum ValuelessEnum {
          Aap,
          Noot,
          Mies,
        }

        function test(): ValuelessEnum { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `ValuelessEnumParser`,
      deps: {
        ValuelessEnumParser: `parser.Enum(0, 1, 2)`,
      },
    })
  })
  test(`SkipEnum`, () => {
    const parsers = generateParsersForFunction(`
        enum SkipEnum {
          Aap = 3,
          Noot,
          Mies,
        }

        function test(): SkipEnum { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `SkipEnumParser`,
      deps: {
        SkipEnumParser: `parser.Enum(3, 4, 5)`,
      },
    })
  })
  test(`MixedEnum.Aap`, () => {
    const parsers = generateParsersForFunction(`
        enum MixedEnum {
          Aap = "x",
          Noot = 0,
          Mies,
        }

        function test(): MixedEnum.Aap { throw new Error() }
    `)

    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: `MixedEnum_AapParser`,
      deps: {
        MixedEnum_AapParser: `parser.StringLiteral("x")`,
      },
    })
  })
})
