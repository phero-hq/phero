import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("enum", () => {
  test(`StringEnum`, () => {
    const modelMap = generateParserModelMap(`
        enum StringEnum {
          Aap = "aap",
          Noot = "noot",
          Mies = "mies",
        }

        function test(): StringEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "enum",
        name: "StringEnum",
        members: [
          {
            type: "enumMember",
            name: "Aap",
            parser: { type: "string-literal", literal: "aap" },
          },
          {
            type: "enumMember",
            name: "Noot",
            parser: { type: "string-literal", literal: "noot" },
          },
          {
            type: "enumMember",
            name: "Mies",
            parser: { type: "string-literal", literal: "mies" },
          },
        ],
      },
      deps: {},
    })
  })
  test(`NumberEnum`, () => {
    const modelMap = generateParserModelMap(`
        enum NumberEnum {
          Aap = 0,
          Noot,
          Mies,
        }

        function test(): NumberEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "enum",
        name: "NumberEnum",
        members: [
          {
            type: "enumMember",
            name: "Aap",
            parser: { type: "number-literal", literal: 0 },
          },
          {
            type: "enumMember",
            name: "Noot",
            parser: { type: "number-literal", literal: 1 },
          },
          {
            type: "enumMember",
            name: "Mies",
            parser: { type: "number-literal", literal: 2 },
          },
        ],
      },
      deps: {},
    })
  })
  test(`MixedEnum`, () => {
    const modelMap = generateParserModelMap(`
        enum MixedEnum {
          Aap = "x",
          Noot = 0,
          Mies,
        }

        function test(): MixedEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "enum",
        name: "MixedEnum",
        members: [
          {
            type: "enumMember",
            name: "Aap",
            parser: { type: "string-literal", literal: "x" },
          },
          {
            type: "enumMember",
            name: "Noot",
            parser: { type: "number-literal", literal: 0 },
          },
          {
            type: "enumMember",
            name: "Mies",
            parser: { type: "number-literal", literal: 1 },
          },
        ],
      },
      deps: {},
    })
  })
  test(`ValuelessEnum`, () => {
    const modelMap = generateParserModelMap(`
        enum ValuelessEnum {
          Aap,
          Noot,
          Mies,
        }

        function test(): ValuelessEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "enum",
        name: "ValuelessEnum",
        members: [
          {
            type: "enumMember",
            name: "Aap",
            parser: { type: "number-literal", literal: 0 },
          },
          {
            type: "enumMember",
            name: "Noot",
            parser: { type: "number-literal", literal: 1 },
          },
          {
            type: "enumMember",
            name: "Mies",
            parser: { type: "number-literal", literal: 2 },
          },
        ],
      },
      deps: {},
    })
  })
  test(`SkipEnum`, () => {
    const modelMap = generateParserModelMap(`
        enum SkipEnum {
          Aap = 3,
          Noot,
          Mies,
        }

        function test(): SkipEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "enum",
        name: "SkipEnum",
        members: [
          {
            type: "enumMember",
            name: "Aap",
            parser: { type: "number-literal", literal: 3 },
          },
          {
            type: "enumMember",
            name: "Noot",
            parser: { type: "number-literal", literal: 4 },
          },
          {
            type: "enumMember",
            name: "Mies",
            parser: { type: "number-literal", literal: 5 },
          },
        ],
      },
      deps: {},
    })
  })
  test(`EnumValue`, () => {
    const modelMap = generateParserModelMap(`
        enum MixedEnum {
          Aap = "x",
          Noot = 0,
          Mies,
        }

        function test(): MixedEnum.Aap { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "enumMember",
        name: "Aap",
        parser: { type: "string-literal", literal: "x" },
      },
      deps: {},
    })
  })
})
