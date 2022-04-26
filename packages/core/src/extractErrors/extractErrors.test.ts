import ts from "typescript"
import { compileStatements } from "../tsTestUtils"
import { parseThrowStatement } from "./extractErrors"

describe("extractErrors", () => {
  test("direct error descendant", () => {
    const {
      statements: [, throwStatement],
      typeChecker,
    } = compileStatements(`
      class SomethingError extends Error {
        public aap = 1
      }

      throw new SomethingError()
    `)

    expect(
      parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
    ).toBe(true)
  })
  test("parent is error descendant", () => {
    const {
      statements: [, , throwStatement],
      typeChecker,
    } = compileStatements(`
      class ParentError extends Error {
        public aap = 1
      }
      class SomethingError extends ParentError {
        
      }

      throw new SomethingError()
    `)

    expect(
      parseThrowStatement(throwStatement as ts.ThrowStatement, typeChecker),
    ).toBe(true)
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
    ).toBe(true)
  })
})
