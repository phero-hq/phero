import ts from "typescript"
import { compileStatements } from "../tsTestUtils"
import parseThrowStatement from "./parseThrowStatement"

describe("parseThrowStatement", () => {
  describe("validate if throw statement throws a descendant of Error", () => {
    test("direct error descendant", () => {
      const {
        statements: [, throwStatement],
        typeChecker,
      } = compileStatements(`
        class SomethingError extends Error {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: ["message"],
      })
    })
    test("parent is error descendant", () => {
      const {
        statements: [, , throwStatement],
        typeChecker,
      } = compileStatements(`
        class ParentError extends Error {
        }
        class SomethingError extends ParentError {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: ["message"],
      })
    })
    test("grandparent is error descendant", () => {
      const {
        statements: [, , , throwStatement],
        typeChecker,
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
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: ["message"],
      })
    })
    test("grandparent is no error descendant", () => {
      const {
        statements: [, , , throwStatement],
        typeChecker,
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
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toBeUndefined()
    })
    test("is Error itself", () => {
      const {
        statements: [throwStatement],
        typeChecker,
      } = compileStatements(`
        throw new Error("error")
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toBeUndefined()
    })
  })

  describe("find properties", () => {
    test("finds all public properties, and ignores private properties", () => {
      const {
        statements: [, throwStatement],
        typeChecker,
      } = compileStatements(`
        class SomethingError extends Error {
          public aap = 1
          kaas = 2
          private noot = 3
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: ["message", "aap", "kaas"],
      })
    })

    test("finds all public constructor properties", () => {
      const {
        statements: [, throwStatement],
        typeChecker,
      } = compileStatements(`
        class SomethingError extends Error {
          constructor(aap, public noot, private mies, public kaas) {
            super("message")
          }
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: ["message", "noot", "kaas"],
      })
    })

    test("finds properties on super classes", () => {
      const {
        statements: [, , throwStatement],
        typeChecker,
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
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining(["message", "one", "three", "four"]),
      })
    })

    test("finds get accessors", () => {
      const {
        statements: [, , throwStatement],
        typeChecker,
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
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining(["message", "aap", "noot"]),
      })
    })
    test("always has at least message prop", () => {
      const {
        statements: [, , throwStatement],
        typeChecker,
      } = compileStatements(`
        class ParentError extends Error {
        }
        class SomethingError extends ParentError {
        }

        throw new SomethingError()
      `)

      expect(
        parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
      ).toMatchObject({
        name: "SomethingError",
        properties: expect.arrayContaining(["message"]),
      })
    })
  })
})
