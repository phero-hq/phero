import ts from "typescript"
import {
  compileStatement,
  compileStatements,
  printCode,
} from "../../tsTestUtils"
import generateParser from "../parsers/generateParser"

describe("Parsers", () => {
  describe("for an interface", () => {
    test("with no members", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          interface MyModel {
          }
        `,
        ts.SyntaxKind.InterfaceDeclaration,
      )

      const parserDeclaration = generateParser(model, typeChecker)

      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)

      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)

      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)

      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)

      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)

      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)

      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
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

      const parserDeclaration = generateParser(model, typeChecker)
      expect(printCode(parserDeclaration)).toMatchSnapshot()
    })
  })
  test("extend an intersection of two interfaces", () => {
    const {
      statements: [model],
      typeChecker,
    } = compileStatements(
      `
          interface MyModel extends C {
            c: number
          }

          type C = A & B

          interface A {
            a: number
          }
          interface B {
            b: number
          }
        `,
    )

    const parserDeclaration = generateParser(
      model as ts.TypeAliasDeclaration,
      typeChecker,
    )
    expect(printCode(parserDeclaration)).toMatchSnapshot()
  })
  test("extend an intersection of two interfaces in namepsace", () => {
    // this is for @phero/client
    const {
      statements: [model],
      typeChecker,
    } = compileStatements(
      `
          interface MyModel extends domain.v_1_0_0.C {
            c: number
          }

          namespace domain.v_1_0_0 {
            export type C = A & B

            interface A {
              a: number
            }
            interface B {
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
