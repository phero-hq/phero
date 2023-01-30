import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("indexSignature", () => {
  test("MyIndexSignature number", () => {
    const modelMap = generateParserModelMap(`

      function test(): {
        [key: string]: string | number;
      } { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "object",
        members: [
          {
            type: "indexMember",
            keyParser: {
              type: "string",
            },
            optional: false,
            parser: {
              type: "union",
              oneOf: [
                {
                  type: "string",
                },
                {
                  type: "number",
                },
              ],
            },
          },
        ],
      },
      deps: {},
    })
  })
  test("MyIndexSignature number", () => {
    const modelMap = generateParserModelMap(`
      type MyIndexSignature = {
        [key: string]: string | number;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyIndexSignature",
      },
      deps: {
        MyIndexSignature: {
          type: "object",
          members: [
            {
              type: "indexMember",
              keyParser: {
                type: "string",
              },
              optional: false,
              parser: {
                type: "union",
                oneOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "number",
                  },
                ],
              },
            },
          ],
        },
      },
    })
  })
  test("MyIndexSignature string", () => {
    const modelMap = generateParserModelMap(`
      type MyIndexSignature = {
        [index: number]: string;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyIndexSignature",
      },
      deps: {
        MyIndexSignature: {
          type: "object",
          members: [
            {
              type: "indexMember",
              keyParser: {
                type: "number",
              },
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
  test("MyIndexSignature string and number", () => {
    const modelMap = generateParserModelMap(`
      type MyIndexSignature = {
        [key: string]: string | number;
        [index: number]: string;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyIndexSignature",
      },
      deps: {
        MyIndexSignature: {
          type: "object",
          members: [
            {
              type: "indexMember",
              keyParser: {
                type: "string",
              },
              optional: false,
              parser: {
                type: "union",
                oneOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "number",
                  },
                ],
              },
            },
            {
              type: "indexMember",
              keyParser: {
                type: "number",
              },
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
  test("MyIndexSignature string and number + prop", () => {
    const modelMap = generateParserModelMap(`
      type MyIndexSignature = {
        [key: string]: string | number;
        [index: number]: string;
        length: number;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyIndexSignature",
      },
      deps: {
        MyIndexSignature: {
          type: "object",
          members: [
            {
              type: "indexMember",
              keyParser: {
                type: "string",
              },
              optional: false,
              parser: {
                type: "union",
                oneOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "number",
                  },
                ],
              },
            },
            {
              type: "indexMember",
              keyParser: {
                type: "number",
              },
              optional: false,
              parser: {
                type: "string",
              },
            },
            {
              type: "member",
              name: "length",
              optional: false,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
  test("MyIndexSignature number", () => {
    const modelMap = generateParserModelMap(`
      type MyIndexSignature = {
        [key: string]: string | number;
        [key: number]: number;
      };

      type MyConditional<T, K = T extends string ? string : MyIndexSignature> = {
        test: K
      }

      function test(): MyConditional<number> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyConditional<number, MyIndexSignature>",
        typeArguments: [
          {
            type: "number",
          },
          {
            type: "object",
            members: [
              {
                type: "indexMember",
                keyParser: {
                  type: "string",
                },
                optional: false,
                parser: {
                  type: "union",
                  oneOf: [
                    {
                      type: "string",
                    },
                    {
                      type: "number",
                    },
                  ],
                },
              },
              {
                type: "indexMember",
                keyParser: {
                  type: "number",
                },
                optional: false,
                parser: {
                  type: "number",
                },
              },
            ],
          },
        ],
      },
      deps: {
        "MyConditional<number, MyIndexSignature>": {
          type: "generic",
          typeName: "MyConditional<number, MyIndexSignature>",
          typeArguments: [
            {
              type: "number",
            },
            {
              type: "object",
              members: [
                {
                  type: "indexMember",
                  keyParser: {
                    type: "string",
                  },
                  optional: false,
                  parser: {
                    type: "union",
                    oneOf: [
                      {
                        type: "string",
                      },
                      {
                        type: "number",
                      },
                    ],
                  },
                },
                {
                  type: "indexMember",
                  keyParser: {
                    type: "number",
                  },
                  optional: false,
                  parser: {
                    type: "number",
                  },
                },
              ],
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "test",
                optional: false,
                parser: {
                  type: "object",
                  members: [
                    {
                      type: "indexMember",
                      keyParser: {
                        type: "string",
                      },
                      optional: false,
                      parser: {
                        type: "union",
                        oneOf: [
                          {
                            type: "string",
                          },
                          {
                            type: "number",
                          },
                        ],
                      },
                    },
                    {
                      type: "indexMember",
                      keyParser: {
                        type: "number",
                      },
                      optional: false,
                      parser: {
                        type: "number",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    })
  })
  test("MyIndexSignatureInterface string and number + prop", () => {
    const modelMap = generateParserModelMap(`
      interface MyIndexSignature {
        [key: string]: string | number;
        [index: number]: string;
        length: number;
      };

      function test(): MyIndexSignature { throw new Error() }
    `)

    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MyIndexSignature",
      },
      deps: {
        MyIndexSignature: {
          type: "object",
          members: [
            {
              type: "indexMember",
              keyParser: {
                type: "string",
              },
              optional: false,
              parser: {
                type: "union",
                oneOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "number",
                  },
                ],
              },
            },
            {
              type: "indexMember",
              keyParser: {
                type: "number",
              },
              optional: false,
              parser: {
                type: "string",
              },
            },
            {
              type: "member",
              name: "length",
              optional: false,
              parser: {
                type: "number",
              },
            },
          ],
        },
      },
    })
  })
})
