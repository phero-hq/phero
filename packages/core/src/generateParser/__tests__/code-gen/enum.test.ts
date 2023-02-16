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
      input: "ObjectLiteralParser()",
      output: `StringEnumParser`,
      deps: {
        StringEnumParser: `EnumParser("aap", "noot", "mies")`,
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
      input: "ObjectLiteralParser()",
      output: `NumberEnumParser`,
      deps: {
        NumberEnumParser: `EnumParser(0, 1, 2)`,
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
      input: "ObjectLiteralParser()",
      output: `MixedEnumParser`,
      deps: {
        MixedEnumParser: `EnumParser("x", 0, 1)`,
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
      input: "ObjectLiteralParser()",
      output: `ValuelessEnumParser`,
      deps: {
        ValuelessEnumParser: `EnumParser(0, 1, 2)`,
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
      input: "ObjectLiteralParser()",
      output: `SkipEnumParser`,
      deps: {
        SkipEnumParser: `EnumParser(3, 4, 5)`,
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
      input: "ObjectLiteralParser()",
      output: `MixedEnum_AapParser`,
      deps: {
        MixedEnum_AapParser: `StringLiteralParser("x")`,
      },
    })
  })
})
