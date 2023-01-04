import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("generics", () => {
  test("MyInterface<number>", () => {
    const modelMap = generateParserModelMap(`
      interface MyInterface<T> {
        prop: T
      }
      function test(): MyInterface<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyInterface",
        typeArguments: [
          {
            type: "number",
          },
        ],
      },
      deps: {
        "MyInterface<T>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "typeParameter",
                name: "T",
                position: 0,
              },
            },
          ],
        },
      },
    })
  })
  test("MyInterface", () => {
    const modelMap = generateParserModelMap(`
      interface MyInterface<T = number> {
        prop: T
      }
      function test(): MyInterface { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyInterface",
        typeArguments: [
          {
            type: "number",
          },
        ],
      },
      deps: {
        "MyInterface<T>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "typeParameter",
                name: "T",
                position: 0,
              },
            },
          ],
        },
      },
    })
  })
  test("MyTypeAlias<number>", () => {
    const modelMap = generateParserModelMap(`
      type MyTypeAlias<T> = {
        prop: T
      }
      function test(): MyTypeAlias<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyTypeAlias",
        typeArguments: [
          {
            type: "number",
          },
        ],
      },
      deps: {
        "MyTypeAlias<T>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "typeParameter",
                name: "T",
                position: 0,
              },
            },
          ],
        },
      },
    })
  })
  test("DeepGeneric<number>", () => {
    const modelMap = generateParserModelMap(`
      interface DeepGeneric<T> {
        prop: Wrap<T>
        nonGenericProp: boolean
      }
      interface Wrap<T> {
        wrap: T
        nonGenericWrap: string
      }
      function test(): DeepGeneric<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "DeepGeneric",
        typeArguments: [
          {
            type: "number",
          },
        ],
      },
      deps: {
        "DeepGeneric<T>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "reference",
                typeName: "Wrap",
                typeArguments: [
                  {
                    type: "typeParameter",
                    name: "T",
                    position: 0,
                  },
                ],
              },
            },
            {
              type: "member",
              name: "nonGenericProp",
              optional: false,
              parser: {
                type: "boolean",
              },
            },
          ],
        },
        "Wrap<T>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "wrap",
              optional: false,
              parser: {
                type: "typeParameter",
                name: "T",
                position: 0,
              },
            },
            {
              type: "member",
              name: "nonGenericWrap",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
      },
    })
  })
  test("EmbeddedGeneric<number>", () => {
    const modelMap = generateParserModelMap(`
      interface EmbeddedGeneric<T> {
        embed: {
          prop: T
        }
      }
      function test(): EmbeddedGeneric<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "EmbeddedGeneric",
        typeArguments: [
          {
            type: "number",
          },
        ],
      },
      deps: {
        "EmbeddedGeneric<T>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "embed",
              optional: false,
              parser: {
                type: "object",
                members: [
                  {
                    type: "member",
                    name: "prop",
                    optional: false,
                    parser: {
                      type: "typeParameter",
                      name: "T",
                      position: 0,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    })
  })
  test("GenericWithDefault<number>", () => {
    const modelMap = generateParserModelMap(`
      interface GenericWithDefault<T, X = string> {
        prop: T
        propDef: X
      }
      function test(): GenericWithDefault<number> { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "GenericWithDefault",
        typeArguments: [
          {
            type: "number",
          },
          {
            type: "string",
          },
        ],
      },
      deps: {
        "GenericWithDefault<T, X>": {
          type: "object",
          members: [
            {
              type: "member",
              name: "prop",
              optional: false,
              parser: {
                type: "typeParameter",
                name: "T",
                position: 0,
              },
            },
            {
              type: "member",
              name: "propDef",
              optional: false,
              parser: {
                type: "typeParameter",
                name: "X",
                position: 0,
              },
            },
          ],
        },
      },
    })
  })
})
