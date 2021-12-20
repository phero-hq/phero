import ts from "typescript"
import { compileStatement, printCode } from "../tsTestUtils"
import { generateParser } from "./generateRPCProxy"
import { TSModelNode } from "./parsers/TSNode"

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
    // describe("intersection", () => {
    //   test.only("simple", () => {
    //     const { statement: model, typeChecker } = compileStatement(
    //       `
    //       type MyModel = {a: string} & ({b: number} | {c: boolean})
    //       // type MyModel = string[] & number[]
    //     `,
    //       ts.SyntaxKind.TypeAliasDeclaration,
    //     )

    //     // console.log("model.type.kind", model.type.kind)
    //     // console.log("model.type.flags", model.type.flags)
    //     // console.log("model.kind", model.kind)

    //     const modelNode = new TSModelNode(model, typeChecker, "data")

    //     // console.log("model.type.kind", modelNode.typeNode.kind)
    //     // console.log("model.type.kind", modelNode.typeNode.flags)

    //     // console.log("xxadlkjaskldj", modelNode.typeNode === model.type)

    //     // console.log(
    //     //   "xxadlkjaskldj2222",
    //     //   typeChecker.getTypeAtLocation(model).flags,
    //     // )

    //     // if (ts.isUnionTypeNode(model.type)) {
    //     //   console.log("ISSS UNIONNNN")
    //     // }
    //     expect(true).toBeFalsy()

    //     // const parserDeclaration = generateParser(model, typeChecker)

    //     // console.log(printCode(parserDeclaration))
    //     // expect(printCode(parserDeclaration)).toMatchSnapshot()
    //   })
    //   // test("simple", () => {
    //   //   const { statement: model, typeChecker } = compileStatement(
    //   //     `
    //   //     type MyModel = {a: string} & ({b: number} | {c: number})
    //   //   `,
    //   //     ts.SyntaxKind.TypeAliasDeclaration,
    //   //   )

    //   //   const parserDeclaration = generateParser(model, typeChecker)

    //   //   console.log(printCode(parserDeclaration))
    //   //   expect(printCode(parserDeclaration)).toMatchSnapshot()
    //   // })
    // })
  })
})
