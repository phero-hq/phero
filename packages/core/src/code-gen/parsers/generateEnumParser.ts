import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { EnumParserModel, ParserModelType } from "./generateParserModel"

export default function generateEnumParser(
  pointer: Pointer<EnumParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateEnumValidator(pointer),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      "not a member of enum",
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

function generateEnumValidator(
  pointer: Pointer<EnumParserModel>,
): ts.Expression {
  const acceptedValues = pointer.model.members.reduce<ts.LiteralExpression[]>((result, member) => {
    if (member.type === ParserModelType.StringLiteral) {
      return [...result, ts.factory.createStringLiteral(member.literal)]
    } else if (member.type === ParserModelType.NumberLiteral) {
      return [...result, ts.factory.createNumericLiteral(member.literal)]
    } else {
      return result
    }
  }, [])

  return ts.factory.createPrefixUnaryExpression(
    ts.SyntaxKind.ExclamationToken,
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createArrayLiteralExpression(acceptedValues, false),
        ts.factory.createIdentifier("includes"),
      ),
      undefined,
      [pointer.dataVarExpr],
    ),
  )
}
