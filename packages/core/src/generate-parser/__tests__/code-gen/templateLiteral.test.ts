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
      output: "GreetingParser",
      deps: {
        GreetingParser: 'StringLiteralParser("hello world")',
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
      output: "AllLocaleIDsParser",
      deps: {
        AllLocaleIDsParser:
          'UnionParser(StringLiteralParser("welcome_email_id"), StringLiteralParser("email_heading_id"), StringLiteralParser("footer_title_id"), StringLiteralParser("footer_sendoff_id"))',
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
      output: "LocaleMessageIDsParser",
      deps: {
        LocaleMessageIDsParser:
          'UnionParser(StringLiteralParser("en_welcome_email_id"), StringLiteralParser("en_email_heading_id"), StringLiteralParser("en_footer_title_id"), StringLiteralParser("en_footer_sendoff_id"), StringLiteralParser("ja_welcome_email_id"), StringLiteralParser("ja_email_heading_id"), StringLiteralParser("ja_footer_title_id"), StringLiteralParser("ja_footer_sendoff_id"), StringLiteralParser("pt_welcome_email_id"), StringLiteralParser("pt_email_heading_id"), StringLiteralParser("pt_footer_title_id"), StringLiteralParser("pt_footer_sendoff_id"))',
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
      output: "EventNameParser",
      deps: {
        EventNameParser:
          'UnionParser(StringLiteralParser("aapChanged"), StringLiteralParser("nootChanged"), StringLiteralParser("miesChanged"))',
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
      output: "ref_1",
      deps: {
        MyTypeParser:
          'ObjectLiteralParser(["aap", false, StringParser], ["noot", false, StringParser], ["mies", false, StringParser])',
        ref_1:
          'UnionParser(StringLiteralParser("aapChanged"), StringLiteralParser("nootChanged"), StringLiteralParser("miesChanged"))',
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
      output: "ShoutyGreetingParser",
      deps: {
        ShoutyGreetingParser: "ref_2",
        GreetingParser: 'StringLiteralParser("Hello, world")',
        ref_2: 'StringLiteralParser("HELLO, WORLD")',
      },
    })
  })
  test("Lowercase", () => {
    const parsers = generateParsersForFunction(`
      function test(): Lowercase<"HELLO WORLD"> { throw new Error() }
    `)

    // console.log(JSON.stringify(parsers, null, 4))
    expect(parsers).toEqual({
      output: "ref_0",
      deps: {
        ref_0: 'StringLiteralParser("hello world")',
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
      output: "MainIDParser",
      deps: {
        MainIDParser: "ref_1",
        ref_1: 'StringLiteralParser("id-my_app")',
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
      output: "EmailParser",
      deps: {
        EmailParser:
          "UnionParser(TemplateLiteralParser(/^\\d+@.+\\.com$/), TemplateLiteralParser(/^\\d+@.+\\.nl$/))",
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
      output: "ref_1",
      deps: {
        ExtParser:
          'ObjectLiteralParser(["com", false, StringParser], ["nl", false, StringParser])',
        ref_1:
          "UnionParser(TemplateLiteralParser(/^\\d+@.+\\.com$/), TemplateLiteralParser(/^\\d+@.+\\.nl$/))",
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
      output: "EmailParser",
      deps: {
        EmailParser:
          "UnionParser(TemplateLiteralParser(/^email:\\d+@.+\\.com$/), TemplateLiteralParser(/^email:\\d+@.+\\.nl$/))",
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
      output: "ref_0",
      deps: {
        ref_0:
          'ObjectLiteralParser(["x", false, TemplateLiteralParser(/^email:\\d+@.+\\.com$/)])',
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
      output: "TestParser",
      deps: {
        TestParser: "TemplateLiteralParser(/^.+@.+x\\d+yyy$/)",
      },
    })
  })
})
