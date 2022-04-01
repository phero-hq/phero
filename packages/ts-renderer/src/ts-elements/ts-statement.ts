import ts from "typescript"
import { generateBlock, TSBlock, TSBlockElement } from "./ts-block"
import { generateConst, TSConst, TSConstElement } from "./ts-const"
import { generateFunction, TSFunctionElement } from "./ts-function"
import { generateIf, TSIf, TSIfElement } from "./ts-if"
import { generateInterface, TSInterfaceElement } from "./ts-interface"
import { generateReturn, TSReturn, TSReturnElement } from "./ts-return"
import { generateTry, TSTry, TSTryElement } from "./ts-try"
import { generateTypeAlias, TSTypeAliasElement } from "./ts-type-alias"
import { UnsupportedElementSupportedError } from "./utils"

export type TSStatement = TSConst | TSBlock | TSIf | TSReturn | TSTry

export type TSStatementElement =
  | TSConstElement
  | TSBlockElement
  | TSIfElement
  | TSReturnElement
  | TSTryElement
  | TSTypeAliasElement
  | TSInterfaceElement
  | TSFunctionElement

export function generateStatement(element: TSStatementElement): ts.Statement {
  switch (element.type) {
    case "ts-const":
      return generateConst(element)
    case "ts-block":
      return generateBlock(element)
    case "ts-if":
      return generateIf(element)
    case "ts-return":
      return generateReturn(element)
    case "ts-try":
      return generateTry(element)
    case "ts-type-alias":
      return generateTypeAlias(element)
    case "ts-interface":
      return generateInterface(element)
    case "ts-function":
      return generateFunction(element)
    case "ts-function":
      return generateFunction(element)
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
