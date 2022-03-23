import ts from "typescript"
import { generateBlock, TSBlock, TSBlockElement } from "./ts-block"
import { generateConst, TSConst, TSConstElement } from "./ts-const"
import { generateIf, TSIf, TSIfElement } from "./ts-if"
import { generateReturn, TSReturn, TSReturnElement } from "./ts-return"
import { UnsupportedElementSupportedError } from "./utils"

export type TSStatement = TSConst | TSBlock | TSIf | TSReturn
export type TSStatementElement =
  | TSConstElement
  | TSBlockElement
  | TSIfElement
  | TSReturnElement

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
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
