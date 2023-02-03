import { generateParserModelForReturnType } from "../../lib/tsTestUtils"

describe("templateLiteral", () => {
  test("Greeting", () => {
    const modelMap = generateParserModelForReturnType(`
      type World = "world"; 
      type Greeting = \`hello \${World}\`;

      function test(): Greeting { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Greeting",
      },
      deps: {
        Greeting: {
          type: "string-literal",
          literal: "hello world",
        },
      },
    })
  })
  test("AllLocaleIDs", () => {
    const modelMap = generateParserModelForReturnType(`
      type EmailLocaleIDs = "welcome_email" | "email_heading";
      type FooterLocaleIDs = "footer_title" | "footer_sendoff";
      type AllLocaleIDs = \`\${EmailLocaleIDs | FooterLocaleIDs}_id\`;

      function test(): AllLocaleIDs { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "AllLocaleIDs",
      },
      deps: {
        AllLocaleIDs: {
          type: "union",
          oneOf: [
            {
              type: "string-literal",
              literal: "welcome_email_id",
            },
            {
              type: "string-literal",
              literal: "email_heading_id",
            },
            {
              type: "string-literal",
              literal: "footer_title_id",
            },
            {
              type: "string-literal",
              literal: "footer_sendoff_id",
            },
          ],
        },
      },
    })
  })
  test("LocaleMessageIDs", () => {
    const modelMap = generateParserModelForReturnType(`
      type EmailLocaleIDs = "welcome_email" | "email_heading";
      type FooterLocaleIDs = "footer_title" | "footer_sendoff";
      type AllLocaleIDs = \`\${EmailLocaleIDs | FooterLocaleIDs}_id\`;
      type Lang = "en" | "ja" | "pt";
      type LocaleMessageIDs = \`\${Lang}_\${AllLocaleIDs}\`;      
      
      function test(): LocaleMessageIDs { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "LocaleMessageIDs",
      },
      deps: {
        LocaleMessageIDs: {
          type: "union",
          oneOf: [
            {
              type: "string-literal",
              literal: "en_welcome_email_id",
            },
            {
              type: "string-literal",
              literal: "en_email_heading_id",
            },
            {
              type: "string-literal",
              literal: "en_footer_title_id",
            },
            {
              type: "string-literal",
              literal: "en_footer_sendoff_id",
            },
            {
              type: "string-literal",
              literal: "ja_welcome_email_id",
            },
            {
              type: "string-literal",
              literal: "ja_email_heading_id",
            },
            {
              type: "string-literal",
              literal: "ja_footer_title_id",
            },
            {
              type: "string-literal",
              literal: "ja_footer_sendoff_id",
            },
            {
              type: "string-literal",
              literal: "pt_welcome_email_id",
            },
            {
              type: "string-literal",
              literal: "pt_email_heading_id",
            },
            {
              type: "string-literal",
              literal: "pt_footer_title_id",
            },
            {
              type: "string-literal",
              literal: "pt_footer_sendoff_id",
            },
          ],
        },
      },
    })
  })
  test("EventName", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyType = { aap: string, noot: string, mies: string }
      type EventName = \`\${string & keyof MyType}Changed\`
      function test(): EventName { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "EventName",
      },
      deps: {
        EventName: {
          type: "union",
          oneOf: [
            {
              type: "string-literal",
              literal: "aapChanged",
            },
            {
              type: "string-literal",
              literal: "nootChanged",
            },
            {
              type: "string-literal",
              literal: "miesChanged",
            },
          ],
        },
      },
    })
  })
  test("EventName generic", () => {
    const modelMap = generateParserModelForReturnType(`
      type MyType = { aap: string, noot: string, mies: string }
      type EventName<T> = \`\${string & keyof T}Changed\`
      function test(): EventName<MyType> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "EventName<MyType>",
        typeArguments: [
          {
            type: "reference",
            typeName: "MyType",
          },
        ],
      },
      deps: {
        MyType: {
          type: "object",
          members: [
            {
              type: "member",
              name: "aap",
              optional: false,
              parser: {
                type: "string",
              },
            },
            {
              type: "member",
              name: "noot",
              optional: false,
              parser: {
                type: "string",
              },
            },
            {
              type: "member",
              name: "mies",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
        "EventName<MyType>": {
          type: "generic",
          typeName: "EventName<MyType>",
          typeArguments: [
            {
              type: "reference",
              typeName: "MyType",
            },
          ],
          parser: {
            type: "union",
            oneOf: [
              {
                type: "string-literal",
                literal: "aapChanged",
              },
              {
                type: "string-literal",
                literal: "nootChanged",
              },
              {
                type: "string-literal",
                literal: "miesChanged",
              },
            ],
          },
        },
      },
    })
  })
  test("ShoutyGreeting", () => {
    const modelMap = generateParserModelForReturnType(`
      type Greeting = "Hello, world"
      type ShoutyGreeting = Uppercase<Greeting>
      function test(): ShoutyGreeting { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "ShoutyGreeting",
      },
      deps: {
        ShoutyGreeting: {
          type: "reference",
          typeName: 'Uppercase<"Hello, world">',
          typeArguments: [
            {
              type: "reference",
              typeName: "Greeting",
            },
          ],
        },
        Greeting: {
          type: "string-literal",
          literal: "Hello, world",
        },
        'Uppercase<"Hello, world">': {
          type: "generic",
          typeName: 'Uppercase<"Hello, world">',
          typeArguments: [
            {
              type: "reference",
              typeName: "Greeting",
            },
          ],
          parser: {
            type: "string-literal",
            literal: "HELLO, WORLD",
          },
        },
      },
    })
  })
  test("Lowercase", () => {
    const modelMap = generateParserModelForReturnType(`
      function test(): Lowercase<"HELLO WORLD"> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: 'Lowercase<"HELLO WORLD">',
        typeArguments: [
          {
            type: "string-literal",
            literal: "HELLO WORLD",
          },
        ],
      },
      deps: {
        'Lowercase<"HELLO WORLD">': {
          type: "generic",
          typeName: 'Lowercase<"HELLO WORLD">',
          typeArguments: [
            {
              type: "string-literal",
              literal: "HELLO WORLD",
            },
          ],
          parser: {
            type: "string-literal",
            literal: "hello world",
          },
        },
      },
    })
  })
  test("ASCIICacheKey", () => {
    const modelMap = generateParserModelForReturnType(`
      type ASCIICacheKey<Str extends string> = \`id-\${Lowercase<Str>}\`
      type MainID = ASCIICacheKey<"MY_APP">
      function test(): MainID { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "MainID",
      },
      deps: {
        MainID: {
          type: "reference",
          typeName: 'ASCIICacheKey<"MY_APP">',
          typeArguments: [
            {
              type: "string-literal",
              literal: "MY_APP",
            },
          ],
        },
        'ASCIICacheKey<"MY_APP">': {
          type: "generic",
          typeName: 'ASCIICacheKey<"MY_APP">',
          typeArguments: [
            {
              type: "string-literal",
              literal: "MY_APP",
            },
          ],
          parser: {
            type: "string-literal",
            literal: "id-my_app",
          },
        },
      },
    })
  })
  test("Email", () => {
    const modelMap = generateParserModelForReturnType(`
      type Ext = "com" | "nl"
      type Email = \`\${number}@\${string}.\${Ext}\`
      function test(): Email { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Email",
      },
      deps: {
        Email: {
          type: "union",
          oneOf: [
            {
              type: "template-literal",
              parsers: [
                {
                  type: "number",
                },
                {
                  type: "string-literal",
                  literal: "@",
                },
                {
                  type: "string",
                },
                {
                  type: "string-literal",
                  literal: ".com",
                },
              ],
            },
            {
              type: "template-literal",
              parsers: [
                {
                  type: "number",
                },
                {
                  type: "string-literal",
                  literal: "@",
                },
                {
                  type: "string",
                },
                {
                  type: "string-literal",
                  literal: ".nl",
                },
              ],
            },
          ],
        },
      },
    })
  })
  test("Email generic", () => {
    const modelMap = generateParserModelForReturnType(`
      type Ext = { com: string, nl: string }
      type Email<T> = \`\${number}@\${string}.\${string & keyof T}\`
      function test(): Email<Ext> { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Email<Ext>",
        typeArguments: [
          {
            type: "reference",
            typeName: "Ext",
          },
        ],
      },
      deps: {
        Ext: {
          type: "object",
          members: [
            {
              type: "member",
              name: "com",
              optional: false,
              parser: {
                type: "string",
              },
            },
            {
              type: "member",
              name: "nl",
              optional: false,
              parser: {
                type: "string",
              },
            },
          ],
        },
        "Email<Ext>": {
          type: "generic",
          typeName: "Email<Ext>",
          typeArguments: [
            {
              type: "reference",
              typeName: "Ext",
            },
          ],
          parser: {
            type: "union",
            oneOf: [
              {
                type: "template-literal",
                parsers: [
                  {
                    type: "number",
                  },
                  {
                    type: "string-literal",
                    literal: "@",
                  },
                  {
                    type: "string",
                  },
                  {
                    type: "string-literal",
                    literal: ".com",
                  },
                ],
              },
              {
                type: "template-literal",
                parsers: [
                  {
                    type: "number",
                  },
                  {
                    type: "string-literal",
                    literal: "@",
                  },
                  {
                    type: "string",
                  },
                  {
                    type: "string-literal",
                    literal: ".nl",
                  },
                ],
              },
            ],
          },
        },
      },
    })
  })
  test("Email protocol", () => {
    const modelMap = generateParserModelForReturnType(`
      type Ext = "com" | "nl"
      type Email = \`email:\${number}@\${string}.\${Ext}\`
      function test(): Email { throw new Error() }
    `)

    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: "Email",
      },
      deps: {
        Email: {
          type: "union",
          oneOf: [
            {
              type: "template-literal",
              parsers: [
                {
                  type: "string-literal",
                  literal: "email:",
                },
                {
                  type: "number",
                },
                {
                  type: "string-literal",
                  literal: "@",
                },
                {
                  type: "string",
                },
                {
                  type: "string-literal",
                  literal: ".com",
                },
              ],
            },
            {
              type: "template-literal",
              parsers: [
                {
                  type: "string-literal",
                  literal: "email:",
                },
                {
                  type: "number",
                },
                {
                  type: "string-literal",
                  literal: "@",
                },
                {
                  type: "string",
                },
                {
                  type: "string-literal",
                  literal: ".nl",
                },
              ],
            },
          ],
        },
      },
    })
  })

  test("Email generic with type constraint and template literal type parameter", () => {
    const modelMap = generateParserModelForReturnType(`
      type Email<T extends string, X = \`email:\${number}@\${string}.\${T}\`> = { x: X }
      function test(): Email<"com"> { throw new Error() }
    `)
    // console.log(JSON.stringify(modelMap, null, 4))
    expect(modelMap).toEqual({
      root: {
        type: "reference",
        typeName: 'Email<"com", `email:${number}@${string}.com`>',
        typeArguments: [
          {
            type: "string-literal",
            literal: "com",
          },
          {
            type: "template-literal",
            parsers: [
              {
                type: "string-literal",
                literal: "email:",
              },
              {
                type: "number",
              },
              {
                type: "string-literal",
                literal: "@",
              },
              {
                type: "string",
              },
              {
                type: "string-literal",
                literal: ".com",
              },
            ],
          },
        ],
      },
      deps: {
        'Email<"com", `email:${number}@${string}.com`>': {
          type: "generic",
          typeName: 'Email<"com", `email:${number}@${string}.com`>',
          typeArguments: [
            {
              type: "string-literal",
              literal: "com",
            },
            {
              type: "template-literal",
              parsers: [
                {
                  type: "string-literal",
                  literal: "email:",
                },
                {
                  type: "number",
                },
                {
                  type: "string-literal",
                  literal: "@",
                },
                {
                  type: "string",
                },
                {
                  type: "string-literal",
                  literal: ".com",
                },
              ],
            },
          ],
          parser: {
            type: "object",
            members: [
              {
                type: "member",
                name: "x",
                optional: false,
                parser: {
                  type: "template-literal",
                  parsers: [
                    {
                      type: "string-literal",
                      literal: "email:",
                    },
                    {
                      type: "number",
                    },
                    {
                      type: "string-literal",
                      literal: "@",
                    },
                    {
                      type: "string",
                    },
                    {
                      type: "string-literal",
                      literal: ".com",
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
})
