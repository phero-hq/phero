import ts from "typescript"
import { compileStatement, compileStatements } from "../tsTestUtils"
import generateParserModel from "./parsers/generateParserModel"

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
  describe("for generics", () => {
    test("type with generic parameter", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          type MyModel<T> = {
            prop: T
          }
        `,
        ts.SyntaxKind.TypeAliasDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("type with default generic parameter", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          type MyModel<T = number> = {
            prop: T
          }
        `,
        ts.SyntaxKind.TypeAliasDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("type with parameterized generic parameter", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = {
            a: Test<number>
          }
          interface Test<T> {
            b: T
            c: boolean
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
  })
  describe("reference", () => {
    test("to another interface", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = {
            a: Test
          }
          interface Test {
            b: number
            c: boolean
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("insde a type literal", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          type MyModel = {
            a: {
              b: Test
            }
          }
          interface Test {
            b: number
            c: boolean
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
  })
  describe("other types", () => {
    test("any / unknown", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          type MyModel = {
            a: any
            b: unknown
          }
        `,
        ts.SyntaxKind.TypeAliasDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("date", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          type MyModel = {
            a: Date
          }
        `,
        ts.SyntaxKind.TypeAliasDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("Partial<Record<X, number>>", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
        type Noot = Partial<Record<X, number>>;
        enum X {
          A,
          B, 
          C,
        }
      `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("Partial<Record<X, string>>", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
        type Noot = Partial<Record<X, string>>;
        enum X {
          A = "a",
          B = "b", 
          C = "c",
        }
      `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("index type", () => {
      const { statement: model, typeChecker } = compileStatement(
        `
          type MyModel = {
            [name: string]: {
              kees: string
            }

            x: {
              kees: string
              kaas: {
                [xx: "aad" | "banaan"]: string
              }
            }
          }
        `,
        ts.SyntaxKind.TypeAliasDeclaration,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
  })

  describe("mapped types", () => {
    test("simple", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          interface MyModel {
            x: {
              [key in "aap" | "noot"]: {
                y: string
              }
            }
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")

      expect(parserModel).toMatchSnapshot()
    })
    test("mapping readonly keys to mutable keys", () => {
      // Example from https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
        type UnlockedAccount = CreateMutable<LockedAccount>;

        type CreateMutable<Type> = {
          readonly [Property in keyof Type]: Type[Property];
        };

        type LockedAccount = {
          readonly id: string;
          readonly name: string;
        };
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
    test("mapping props to booleans", () => {
      // Example from https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
      type FeatureOptions = Partial<OptionsFlags<FeatureFlags>>;

      type FeatureFlags = {
        darkMode: () => void;
        newUserProfile: () => void;
      };
 
      type OptionsFlags<Type> = {
        [Property in keyof Type]: boolean;
      };
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
  })

  describe("type operator node", () => {
    test("keyof an interface", () => {
      const {
        statements: [model],
        typeChecker,
      } = compileStatements(
        `
          interface MyModel {
            props: {
              [prop in keyof MyOtherModel]: number
            }
          }

          interface MyOtherModel {
            kaas: number
            koos: string  
          }
        `,
      )

      const parserModel = generateParserModel(typeChecker, model, "data")
      expect(parserModel).toMatchSnapshot()
    })
  })
})
