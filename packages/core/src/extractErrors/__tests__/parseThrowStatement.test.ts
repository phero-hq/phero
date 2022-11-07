import ts from "typescript"
import { compileStatements } from "../../tsTestUtils"
import parseThrowStatement from "../parseThrowStatement"

describe("parseThrowStatement", () => {
  describe("validate if throw statement throws a descendant of Error", () => {
    test("direct error descendant", () => {
      const {
        statements: [, throwStatement],
        prog,
      } = compileStatements(`
        class SomethingError extends Error {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
        ]),
      })
    })
    test("parent is error descendant", () => {
      const {
        statements: [, , throwStatement],
        prog,
      } = compileStatements(`
        class ParentError extends Error {
        }
        class SomethingError extends ParentError {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
        ]),
      })
    })
    test("grandparent is error descendant", () => {
      const {
        statements: [, , , throwStatement],
        prog,
      } = compileStatements(`
        class GrantParentError extends Error {
        }
        class ParentError extends GrantParentError {
        }
        class SomethingError extends ParentError {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
        ]),
      })
    })
    test("grandparent is no error descendant", () => {
      const {
        statements: [, , , throwStatement],
        prog,
      } = compileStatements(`
        class GrantParentError  {
        }
        class ParentError extends GrantParentError {
        }
        class SomethingError extends ParentError {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toBeUndefined()
    })
    test("is Error itself", () => {
      const {
        statements: [throwStatement],
        prog,
      } = compileStatements(`
        throw new Error("error")
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toBeUndefined()
    })
  })

  describe("find properties", () => {
    test("finds all public properties, and ignores private properties", () => {
      const {
        statements: [, throwStatement],
        prog,
      } = compileStatements(`
        class SomethingError extends Error {
          public aap = 1
          kaas = true
          private noot = 3
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
          expect.objectContaining({
            name: "aap",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.NumberKeyword,
            }),
          }),
          expect.objectContaining({
            name: "kaas",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.BooleanKeyword,
            }),
          }),
        ]),
      })
    })

    test("finds all public constructor properties", () => {
      const {
        statements: [, throwStatement],
        prog,
      } = compileStatements(`
        class SomethingError extends Error {
          constructor(aap: string, public noot: boolean, private mies: number, public kaas: string) {
            super("message")
          }
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
          expect.objectContaining({
            name: "noot",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.BooleanKeyword,
            }),
          }),
          expect.objectContaining({
            name: "kaas",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
        ]),
      })
    })

    test("finds properties on super classes", () => {
      const {
        statements: [, , throwStatement],
        prog,
      } = compileStatements(`
        class ParentError extends Error {
          public one = 1
          constructor(two: number, public three: number) {
            super("message")
          }
        }
        class SomethingError extends ParentError {
            constructor(public four: number, five: number) {
              super(four, five)
            }
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
          expect.objectContaining({
            name: "one",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.NumberKeyword,
            }),
          }),
          expect.objectContaining({
            name: "three",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.NumberKeyword,
            }),
          }),
          expect.objectContaining({
            name: "four",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.NumberKeyword,
            }),
          }),
        ]),
      })
    })

    test("finds get accessors", () => {
      const {
        statements: [, , throwStatement],
        prog,
      } = compileStatements(`
        class ParentError extends Error {
          get aap(): string {
            return "aap"
          }
        }
        class SomethingError extends ParentError {
          get noot(): string {
            return "noot"
          }
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
          expect.objectContaining({
            name: "aap",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
          expect.objectContaining({
            name: "noot",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
        ]),
      })
    })
    test("always has at least message prop", () => {
      const {
        statements: [, , throwStatement],
        prog,
      } = compileStatements(`
        class ParentError extends Error {
        }
        class SomethingError extends ParentError {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
        ]),
      })
    })
    test("correct type for complex properties", () => {
      const {
        statements: [, , throwStatement],
        prog,
      } = compileStatements(`
        class ParentError extends Error {
          public test: {
            kaas: boolean
          }
        }
        class SomethingError extends ParentError {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, prog),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: "message",
            type: expect.objectContaining({
              kind: ts.SyntaxKind.StringKeyword,
            }),
          }),
          expect.objectContaining({
            name: "test",
            // test
            type: expect.objectContaining({
              kind: ts.SyntaxKind.TypeLiteral,
              members: expect.arrayContaining([
                // kaas
                expect.objectContaining({
                  type: expect.objectContaining({
                    kind: ts.SyntaxKind.BooleanKeyword,
                  }),
                }),
              ]),
            }),
          }),
        ]),
      })
    })
  })
})
