import ts from "typescript"
import Pointer from "./Pointer"
import { assignDataToResult } from "./generateParserLib"
import { AnyParserModel } from "./generateParserModel"

export default function generateAnyParser(
  pointer: Pointer<AnyParserModel>,
): ts.Statement {
  return assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr)
}
