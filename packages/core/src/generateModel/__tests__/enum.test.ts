import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("enum", () => {
  test(`StringEnum`, () => {
    const modelMap = generateParserModelForReturnType(`
        enum StringEnum {
          Aap = "aap",
          Noot = "noot",
          Mies = "mies",
        }

        function test(): StringEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "StringEnum",
      },
      deps: {
        StringEnum: {
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
      },
    })
  })
  test(`NumberEnum`, () => {
    const modelMap = generateParserModelForReturnType(`
        enum NumberEnum {
          Aap = 0,
          Noot,
          Mies,
        }

        function test(): NumberEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "NumberEnum",
      },
      deps: {
        NumberEnum: {
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
      },
    })
  })
  test(`MixedEnum`, () => {
    const modelMap = generateParserModelForReturnType(`
        enum MixedEnum {
          Aap = "x",
          Noot = 0,
          Mies,
        }

        function test(): MixedEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MixedEnum",
      },
      deps: {
        MixedEnum: {
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
      },
    })
  })
  test(`ValuelessEnum`, () => {
    const modelMap = generateParserModelForReturnType(`
        enum ValuelessEnum {
          Aap,
          Noot,
          Mies,
        }

        function test(): ValuelessEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "ValuelessEnum",
      },
      deps: {
        ValuelessEnum: {
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
      },
    })
  })
  test(`SkipEnum`, () => {
    const modelMap = generateParserModelForReturnType(`
        enum SkipEnum {
          Aap = 3,
          Noot,
          Mies,
        }

        function test(): SkipEnum { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "SkipEnum",
      },
      deps: {
        SkipEnum: {
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
      },
    })
  })
  test(`MixedEnum.Aap`, () => {
    const modelMap = generateParserModelForReturnType(`
        enum MixedEnum {
          Aap = "x",
          Noot = 0,
          Mies,
        }

        function test(): MixedEnum.Aap { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MixedEnum.Aap",
      },
      deps: {
        "MixedEnum.Aap": {
          type: "enumMember",
          name: "Aap",
          parser: { type: "string-literal", literal: "x" },
        },
      },
    })
  })
})
