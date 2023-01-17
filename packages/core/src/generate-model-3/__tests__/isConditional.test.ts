import ts from "typescript"
import { compileStatements } from "../../lib/tsTestUtils"
import isConditionalType from "../isConditionalType"

describe.skip("conditional", () => {
  describe("isConditional", () => {
    test("TypeAlias with conditional TypeLiteralTypeNode", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T> = T extends string ? {
          prop: number
        } : {
          prop: string
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with conditional property", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T, X = T extends string ? string : number> = {
          prop: X
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with conditional property of array type", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T, X = T extends string ? string : number> = {
          prop: X[]
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with conditional property of array type", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T, X = T extends string ? string : number> = {
          prop: [string, X]
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with conditional property of array type", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T, X = T extends string ? string : number> = {
          prop: [string, X]
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with conditional parenthesized & intersection property", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T, X = T extends string ? {b: number} : {c: number}> = {
          prop: ({ a: string} & X)
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with conditional union property", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T, X = T extends string ? {b: number} : {c: number}> = {
          prop: { a: string} | X
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with constrainted type param", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T extends string> = {
          prop: T
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("TypeAlias with default type param", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        type MyConditionalType<T = string> = {
          prop: T
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(false)
    })
    test("interface with conditional property", () => {
      const {
        statements: [MyConditionalType],
        prog,
      } = compileStatements(`
        interface MyConditionalType<T, X = T extends string ? string : number> {
          prop: X
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.InterfaceDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("interface with deep conditional property", () => {
      const {
        statements: [MyConditionalType, Deep],
        prog,
      } = compileStatements(`
        interface MyConditionalType<T> {
          prop: Deep<T>
        }
        interface Deep<T, X = T extends string ? string : number> {
          deep: X
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.InterfaceDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
      expect(
        isConditionalType(
          Deep as ts.InterfaceDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("interface with deep non conditional property", () => {
      const {
        statements: [MyConditionalType, Deep],
        prog,
      } = compileStatements(`
        interface MyConditionalType<T, X = T extends string ? string : number> {
          prop: X
          prop: Deep<T>
        }
        interface Deep<T> {
          deep: T
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.InterfaceDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
      expect(
        isConditionalType(
          Deep as ts.InterfaceDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(false)
    })
    test("type alias with deep conditional property parameterized with type parameter", () => {
      const {
        statements: [MyConditionalType, DeepCondition],
        prog,
      } = compileStatements(`
        type MyDeepConditionalType<T> = {
          a: T
          deep: DeepCondition<T>
        }

        type DeepCondition<T> = T extends string
          ? {
              prop: number
            }
          : {
              prop: string
            }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
      expect(
        isConditionalType(
          DeepCondition as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })

    test("type alias with deep conditional property parameterized with default parameter", () => {
      const {
        statements: [MyConditionalType, DeepCondition],
        prog,
      } = compileStatements(`
        type MyDeepConditionalType<T> = {
          a: T
          deep: DeepCondition
        }

        type DeepCondition<T = string> = T extends string
          ? {
              prop: number
            }
          : {
              prop: string
            }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(false)
      expect(
        isConditionalType(
          DeepCondition as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("type alias with deep conditional property parameterized with a finite parameter", () => {
      const {
        statements: [MyDeepConditionalType, DeepCondition],
        prog,
      } = compileStatements(`
        type MyDeepConditionalType<T> = {
          a: T
          deep: DeepCondition<string>
        }

        type DeepCondition<T> = T extends string
          ? {
              prop: number
            }
          : {
              prop: string
            }
      `)

      expect(
        isConditionalType(
          MyDeepConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(false)
      expect(
        isConditionalType(
          DeepCondition as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(true)
    })
    test("type alias with deep non conditional property parameterized with a type parameter", () => {
      const {
        statements: [MyConditionalType, DeepCondition],
        prog,
      } = compileStatements(`
        type MyDeepConditionalType<T> = {
          a: T
          deep: DeepCondition<T>
        }

        type DeepCondition<T> = {
          prop: T
        }
      `)

      expect(
        isConditionalType(
          MyConditionalType as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(false)
      expect(
        isConditionalType(
          DeepCondition as ts.TypeAliasDeclaration,
          prog.getTypeChecker(),
        ),
      ).toBe(false)
    })
  })
})

// MET JASPER:
// // MyDeepConditionalRecursiveType<number>

// const MyDeepConditionalRecursiveType_number_Parser = {
//   prop: Wrap_number_boolean_Parser
// }

// const Wrap_number_boolean_Parser = {
//   w: NumberParser,
//   b: BooleanParser,
//   recursive: MyDeepConditionalRecursiveType_boolean_Parser,
// }

// const MyDeepConditionalRecursiveType_boolean_Parser = {
//   prop: Wrap_boolean_boolean_Parser
// }

// const Wrap_boolean_boolean_Parser = {
//   w: BooleanParser,
//   b: BooleanParser,
//   recursive: MyDeepConditionalRecursiveType_boolean_Parser,
// }

// // MyDeepConditionalRecursiveType<string>

// const MyDeepConditionalRecursiveType_string_Parser = {
//   prop: Wrap_string_number_Parser
// }

// const Wrap_string_number_Parser = {
//   w: StringParser,
//   b: NumberParser,
//   recursive: MyDeepConditionalRecursiveType_number_Parser,
// }
