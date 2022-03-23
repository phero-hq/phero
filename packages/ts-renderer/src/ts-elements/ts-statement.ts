import ts from "typescript"
import { generateBlock, TSBlock, TSBlockElement } from "./ts-block"
import { generateConst, TSConst, TSConstElement } from "./ts-const"
import { generateIf, TSIf, TSIfElement } from "./ts-if"
import { generateReturn, TSReturn, TSReturnElement } from "./ts-return"
import { generateTry, TSTry, TSTryElement } from "./ts-try"
import { UnsupportedElementSupportedError } from "./utils"

export type TSStatement = TSConst | TSBlock | TSIf | TSReturn | TSTry

export type TSStatementElement =
  | TSConstElement
  | TSBlockElement
  | TSIfElement
  | TSReturnElement
  | TSTryElement

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
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
