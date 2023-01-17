import ts from "typescript"
import {
  compileStatements,
  generateParserModelMap,
  printCode,
} from "../../lib/tsTestUtils"
import { getSymbolWithDeclarationOrThrow } from "../generateParserModel"

describe.skip("parameter dingen", () => {
  test("test", () => {
    const {
      statements: [MyDeepConditionalType, Cake, DeepCondition, testFunc],
      prog,
    } = compileStatements(`
      type MyDeepConditionalType<T> = {
        deep: DeepCondition<T, Cake>
      }

      interface Cake {
        haBerries: boolean
      }

      type DeepCondition<A, X, T = boolean> = T extends string ? {
        prop: number
      } : {
        prop: string
      }

      function test(): MyDeepConditionalType<number> { throw new Error() }
    `)

    const typeChecker = prog.getTypeChecker()

    if (ts.isFunctionDeclaration(testFunc) && testFunc.type) {
      if (ts.isTypeReferenceNode(testFunc.type)) {
        const { declaration: myDeepConditionalTypeDeclaration } =
          getSymbolWithDeclarationOrThrow(testFunc.type, typeChecker)

        if (ts.isTypeAliasDeclaration(myDeepConditionalTypeDeclaration)) {
          if (myDeepConditionalTypeDeclaration.typeParameters) {
            let i = 0
            for (const tp of myDeepConditionalTypeDeclaration.typeParameters) {
              console.log(
                "PARAM",
                tp.name.text,
                testFunc.type.typeArguments &&
                  printCode(testFunc.type.typeArguments?.[i]),
              )
            }
          }
        }
      }
    }
  })
})
