import { generateParsersForFunction } from "../../../lib/tsTestUtils"

describe("templateLiteral", () => {
  test("Greeting", () => {
    const parsers = generateParsersForFunction(`
      type World = "world"; 
      type Greeting = \`hello \${World}\`;

      function test(): Greeting { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "GreetingParser",
      deps: {
        GreetingParser: 'parser.StringLiteral("hello world")',
      },
    })
  })
  test("AllLocaleIDs", () => {
    const parsers = generateParsersForFunction(`
      type EmailLocaleIDs = "welcome_email" | "email_heading";
      type FooterLocaleIDs = "footer_title" | "footer_sendoff";
      type AllLocaleIDs = \`\${EmailLocaleIDs | FooterLocaleIDs}_id\`;

      function test(): AllLocaleIDs { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "AllLocaleIDsParser",
      deps: {
        AllLocaleIDsParser:
          'parser.Union(parser.StringLiteral("welcome_email_id"), parser.StringLiteral("email_heading_id"), parser.StringLiteral("footer_title_id"), parser.StringLiteral("footer_sendoff_id"))',
      },
    })
  })
  test("LocaleMessageIDs", () => {
    const parsers = generateParsersForFunction(`
      type EmailLocaleIDs = "welcome_email" | "email_heading";
      type FooterLocaleIDs = "footer_title" | "footer_sendoff";
      type AllLocaleIDs = \`\${EmailLocaleIDs | FooterLocaleIDs}_id\`;
      type Lang = "en" | "ja" | "pt";
      type LocaleMessageIDs = \`\${Lang}_\${AllLocaleIDs}\`;      
      
      function test(): LocaleMessageIDs { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "LocaleMessageIDsParser",
      deps: {
        LocaleMessageIDsParser:
          'parser.Union(parser.StringLiteral("en_welcome_email_id"), parser.StringLiteral("en_email_heading_id"), parser.StringLiteral("en_footer_title_id"), parser.StringLiteral("en_footer_sendoff_id"), parser.StringLiteral("ja_welcome_email_id"), parser.StringLiteral("ja_email_heading_id"), parser.StringLiteral("ja_footer_title_id"), parser.StringLiteral("ja_footer_sendoff_id"), parser.StringLiteral("pt_welcome_email_id"), parser.StringLiteral("pt_email_heading_id"), parser.StringLiteral("pt_footer_title_id"), parser.StringLiteral("pt_footer_sendoff_id"))',
      },
    })
  })
  test("EventName", () => {
    const parsers = generateParsersForFunction(`
      type MyType = { aap: string, noot: string, mies: string }
      type EventName = \`\${string & keyof MyType}Changed\`
      function test(): EventName { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "EventNameParser",
      deps: {
        EventNameParser:
          'parser.Union(parser.StringLiteral("aapChanged"), parser.StringLiteral("nootChanged"), parser.StringLiteral("miesChanged"))',
      },
    })
  })
  test("EventName generic", () => {
    const parsers = generateParsersForFunction(`
      type MyType = { aap: string, noot: string, mies: string }
      type EventName<T> = \`\${string & keyof T}Changed\`
      function test(): EventName<MyType> { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        MyTypeParser:
          'parser.ObjectLiteral(["aap", false, parser.String], ["noot", false, parser.String], ["mies", false, parser.String])',
        ref_0:
          'parser.Union(parser.StringLiteral("aapChanged"), parser.StringLiteral("nootChanged"), parser.StringLiteral("miesChanged"))',
      },
    })
  })
  test("ShoutyGreeting", () => {
    const parsers = generateParsersForFunction(`
      type Greeting = "Hello, world"
      type ShoutyGreeting = Uppercase<Greeting>
      function test(): ShoutyGreeting { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ShoutyGreetingParser",
      deps: {
        ShoutyGreetingParser: "ref_0",
        GreetingParser: 'parser.StringLiteral("Hello, world")',
        ref_0: 'parser.StringLiteral("HELLO, WORLD")',
      },
    })
  })
  test("Lowercase", () => {
    const parsers = generateParsersForFunction(`
      function test(): Lowercase<"HELLO WORLD"> { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0: 'parser.StringLiteral("hello world")',
      },
    })
  })
  test("ASCIICacheKey", () => {
    const parsers = generateParsersForFunction(`
      type ASCIICacheKey<Str extends string> = \`id-\${Lowercase<Str>}\`
      type MainID = ASCIICacheKey<"MY_APP">
      function test(): MainID { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "MainIDParser",
      deps: {
        MainIDParser: "ref_0",
        ref_0: 'parser.StringLiteral("id-my_app")',
      },
    })
  })
  test("Email", () => {
    const parsers = generateParsersForFunction(`
      type Ext = "com" | "nl"
      type Email = \`\${number}@\${string}.\${Ext}\`
      function test(): Email { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "EmailParser",
      deps: {
        EmailParser:
          "parser.Union(parser.TemplateLiteral(/^\\d+@.+\\.com$/), parser.TemplateLiteral(/^\\d+@.+\\.nl$/))",
      },
    })
  })
  test("Email generic", () => {
    const parsers = generateParsersForFunction(`
      type Ext = { com: string, nl: string }
      type Email<T> = \`\${number}@\${string}.\${string & keyof T}\`
      function test(): Email<Ext> { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ExtParser:
          'parser.ObjectLiteral(["com", false, parser.String], ["nl", false, parser.String])',
        ref_0:
          "parser.Union(parser.TemplateLiteral(/^\\d+@.+\\.com$/), parser.TemplateLiteral(/^\\d+@.+\\.nl$/))",
      },
    })
  })
  test("Email protocol", () => {
    const parsers = generateParsersForFunction(`
      type Ext = "com" | "nl"
      type Email = \`email:\${number}@\${string}.\${Ext}\`
      function test(): Email { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "EmailParser",
      deps: {
        EmailParser:
          "parser.Union(parser.TemplateLiteral(/^email:\\d+@.+\\.com$/), parser.TemplateLiteral(/^email:\\d+@.+\\.nl$/))",
      },
    })
  })

  test("Email generic with type constraint and template literal type parameter", () => {
    const parsers = generateParsersForFunction(`
      type Email<T extends string, X = \`email:\${number}@\${string}.\${T}\`> = { x: X }
      function test(): Email<"com"> { throw new Error() }
    `)
    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "ref_0",
      deps: {
        ref_0:
          'parser.ObjectLiteral(["x", false, parser.TemplateLiteral(/^email:\\d+@.+\\.com$/)])',
      },
    })
  })
  test("Template literal within a template literal", () => {
    const parsers = generateParsersForFunction(`
      type Test = \`$\{string}@$\{\`\${string}x\${number}\`}yyy\`
      function test(): Test { throw new Error() }
    `)
    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      input: "parser.ObjectLiteral()",
      output: "TestParser",
      deps: {
        TestParser: "parser.TemplateLiteral(/^.+@.+x\\d+yyy$/)",
      },
    })
  })
})
