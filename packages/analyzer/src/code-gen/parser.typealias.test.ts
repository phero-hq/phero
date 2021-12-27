import ts from "typescript"
import { compileStatement, compileStatements, printCode } from "../tsTestUtils"
import { generateParser } from "./generateRPCProxy"

describe("Parsers", () => {
  describe("for a type alias", () => {
    describe("object literal", () => {
      test("with no members", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {}
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("number member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: number
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("number model", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = number
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("string member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: string
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })

      test("boolean member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: boolean
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("null member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: null
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("optional member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a?: string
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("string literal member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: "xxx"
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("number literal member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: 123
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("true literal member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: true
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("string array member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: string[]
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("optional string array member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a?: string[]
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("number array member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: number[]
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("boolean array member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: boolean[]
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("object literal member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: {b: number}[]
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("optional object literal member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a?: {b: number}[]
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("optional object literal with optional member", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a?: {
              b?: number
            }
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("deep nested object", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {
            a: {
              b?: {c: { d?: number }}[]
            }
          }
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })

    describe("tuple", () => {
      test("simple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = [string, number]
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("tuple with typealias", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = [string, {a: number}]
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("tuple within tuple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = [string, [{a: number}, boolean]]
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })
    describe("union", () => {
      test("simple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = string | number
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("with type literal", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = string | {a: number}
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("with tuple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = string | [{a: number}, string]
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("with tuple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {a: string, b: number} | {a: number, b: string}
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })
    describe("intersection", () => {
      test("simple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {a: string} & {b: string}
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("object literal with union", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {a: string} & ({b: number} | {c: boolean})
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("object literal with complex union", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {a: string} & ({b: number, c: {d:123}} | {c: boolean, b: string})
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })
    describe("typescript utility types", () => {
      test("Pick", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
        type MyModel = {
          a: Pick<{a: string, b: boolean, c:number}, "b">
        }
      `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserDeclaration = generateParser(model, typeChecker)
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("Omit", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
          type MyModel = {
            a: Omit<Aad, "c">
          }  
          interface Aad {
            kees: {
              a: number
            }
            c: number
          }
          interface Aad {
            kees: {
              b: number
            }
          }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })
    describe("Generics", () => {
      test("native generic", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
        type MyModel<T> = {
          a: T
        }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })
    describe("Reference", () => {
      test("to antoher interface", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
        type MyModel = {
          a: Aad
        }
        interface Aad {
          a: number
        }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })

    describe("index types", () => {
      test("string keys", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
        type MyModel = {
          [key: string]: {
            a: string
          }
        }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("number keys", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
        type MyModel = {
          [key: number]: {
            a: string
          }
        }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("union string keys", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
        type MyModel = {
          [name: "aap" | "noot"]: {
            a: string
          }
        }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("union number keys", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
        type MyModel = {
          [name: 10 | 20]: {
            a: string
          }
        }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
      test("keyof keys", () => {
        const {
          statements: [model],
          typeChecker,
        } = compileStatements(
          `
        type MyModel = {
          [name in keyof Kees]: {
            a: string
          }
        }
        interface Kees {
          aap: string
          noot: number
        }
      `,
        )

        const parserDeclaration = generateParser(
          model as ts.TypeAliasDeclaration,
          typeChecker,
        )
        expect(printCode(parserDeclaration)).toMatchSnapshot()
      })
    })
  })
})
