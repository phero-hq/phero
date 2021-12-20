import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import {
  BooleanParserModel,
  EnumParserModel,
  ParserModelType,
} from "./generateParserModel"
import { Pointer } from "./Pointers"
import { TSNode } from "./TSNode"

export default function generateEnumParser(
  pointer: NewPointer<EnumParserModel>,
): ts.Statement {
  const acceptedValues = pointer.model.members.reduce((result, member) => {
    if (member.type === ParserModelType.StringLiteral) {
      return [...result, ts.factory.createStringLiteral(member.literal)]
    } else if (member.type === ParserModelType.NumberLiteral) {
      return [...result, ts.factory.createNumericLiteral(member.literal)]
    } else {
      return result
    }
  }, [] as ts.LiteralExpression[])

  return ts.factory.createIfStatement(
    ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createArrayLiteralExpression(acceptedValues, false),
          ts.factory.createIdentifier("includes"),
        ),
        undefined,
        [pointer.dataVarExpr],
      ),
    ),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      "not a member of enum",
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}
