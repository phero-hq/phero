import { generateParserModelMap } from "../../lib/tsTestUtils"

describe("unsupported", () => {
  test("class", () => {
    expect(() =>
      generateParserModelMap(`
      class Test {
        public aap: number = 1
      }

      function test(): Test { throw new Error() }
    `),
    ).toThrow("References to class types are not supported")
  })
  test("interface with methods", () => {
    expect(() =>
      generateParserModelMap(`
      interface Test {
        aap(a: number, b: number): number
      }

      function test(): Test { throw new Error() }
    `),
    ).toThrow("Type with methods are not supported")
  })
  test("interface with methods", () => {
    expect(() =>
      generateParserModelMap(`
      interface Test {
        aap: (a: number, b: number) => number
      }

      function test(): Test { throw new Error() }
    `),
    ).toThrow("Function types are not supported")
  })
  test("Function type", () => {
    expect(() =>
      generateParserModelMap(`
      type Test = (a: number, b: number): number

      function test(): Test { throw new Error() }
    `),
    ).toThrow("Function types are not supported")
  })
  test("Function types are not supported", () => {
    expect(() =>
      generateParserModelMap(`
      interface Test {
        (a: number, b: number): number
        (a: number, b: number, c: string): number
      }

      function test(): Test { throw new Error() }
    `),
    ).toThrow("Type with methods are not supported")
  })
})
