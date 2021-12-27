import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { ReferenceParserModel } from "./generateParserModel"

export default function generateReferenceParser(
  pointer: Pointer<ReferenceParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateReferenceValidator(pointer),
    // TODO populate the errors with the actual errors
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      `not an ${pointer.model.name}`,
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

function generateReferenceValidator(
  pointer: Pointer<ReferenceParserModel>,
): ts.Expression {
  return ts.factory.createPrefixUnaryExpression(
    ts.SyntaxKind.ExclamationToken,
    ts.factory.createPropertyAccessExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier(`${pointer.model.name}Parser`),
          ts.factory.createIdentifier("parse"),
        ),
        undefined,
        [pointer.dataVarExpr],
      ),
      ts.factory.createIdentifier("ok"),
    ),
  )
}
