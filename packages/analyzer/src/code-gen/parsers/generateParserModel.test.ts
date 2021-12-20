import ts from "typescript"
import { compileStatement, compileStatements } from "../../tsTestUtils"
import { generateParserModel } from "./generateParserModel"

describe("generateParserModel", () => {
  describe("for an interface", () => {
    test("with no members", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("number member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: number
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("string member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: string
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("boolean member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: boolean
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("null member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: null
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("optional member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a?: string
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("string literal member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: "aap"
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("number literal member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: 123
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("true literal member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: true
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("string array member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: string[]
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("optional string array member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a?: string[]
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("number array member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: number[]
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("boolean array member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: boolean[]
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("object literal member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: {
              b: number
            }
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("object literal array member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: {
              b: number
            }[]
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("optional object literal member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a?: {
              b: number
            }
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("optional object literal with optional member", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a?: {
              b?: number
            }
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("deep nested object", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
            a: {
              b?: {
                c: {
                  d: {
                    e: {
                      f: boolean[]
                    }
                  }[]
                }
              }
            }[]
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
  })
  describe("for a type alias", () => {
    describe("object literal", () => {
      test("with no members", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {}
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
      test("number model", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = number
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
      test("tuple with typealias", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = [string, {a: number}]
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
      test("tuple within tuple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = [string, [{a: number}, boolean]]
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
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

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
      test("with type literal", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = string | {a: number}
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
      test("with tuple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = string | [{a: number}, string]
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
      test("with tuple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {a: string, b: number} | {a: number, b: string}
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
    })

    describe("intersection", () => {
      test("simple", () => {
        const { statement: model, typeChecker } = compileStatement(
          `
          type MyModel = {a: string} & ({b: number} | {c?: boolean})
        `,
          ts.SyntaxKind.TypeAliasDeclaration,
        )

        const parserModel = generateParserModel(typeChecker, model, "data")
        expect(parserModel).toMatchSnapshot()
      })
    })
  })
  describe("for enums", () => {
    test("enum with string enum members", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = {
            en: MyEnum
          }
          enum MyEnum {
            A = "a",
            B = "b",
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("enum with number enum members", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = {
            en: MyEnum
          }
          enum MyEnum {
            A = 0,
            B = 1,
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("enum with auto number enum members", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = {
            en: MyEnum
          }
          enum MyEnum {
            A = 0,
            B = 100,
            C,
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("enum member", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = {
            en: MyEnum.A
          }
          enum MyEnum {
            A,
            B,
            C,
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("enum model", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = MyEnum
          enum MyEnum {
            A,
            B,
            C,
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("enum member model", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = MyEnum.B
          enum MyEnum {
            A,
            B,
            C,
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
  })
})
