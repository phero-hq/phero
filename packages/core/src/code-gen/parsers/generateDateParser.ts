import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { DateParserModel } from "./generateParserModel"
import * as tsx from "../../tsx"

export default function generateDateParser(
  pointer: Pointer<DateParserModel>,
): ts.Statement {
  return tsx.block(
    tsx.verbatim(`console.log("data", data);`),
    tsx.statement.if({
      expression: generateDateValidator(pointer),
      then: generatePushErrorExpressionStatement(
        pointer.errorPath,
        `is not a Date`,
      ),
      else: assignDataToResult(
        pointer.resultVarExpr,
        ts.factory.createNewExpression(
          ts.factory.createIdentifier("Date"),
          undefined,
          [pointer.dataVarExpr],
        ),
      ),
    }),
  )
}

function generateDateValidator(
  pointer: Pointer<DateParserModel>,
): ts.Expression {
  return tsx.expression.binary(
    tsx.expression.prefixUnary(
      "!",
      tsx.expression.parenthesis(
        ts.factory.createBinaryExpression(
          pointer.dataVarExpr,
          ts.factory.createToken(ts.SyntaxKind.InstanceOfKeyword),
          tsx.expression.identifier("Date"),
        ),
      ),
    ),
    "&&",
    generateDateStringValidator(pointer),
  )
}

function generateDateStringValidator(
  pointer: Pointer<DateParserModel>,
): ts.Expression {
  return tsx.expression.binary(
    tsx.expression.binary(
      tsx.expression.typeof(pointer.dataVarExpr),
      "!==",
      tsx.literal.string("string"),
    ),
    "||",
    tsx.expression.negate(
      tsx.expression.call(
        tsx.expression.propertyAccess(pointer.dataVarExpr, "match"),
        {
          args: [
            tsx.literal.regularExpression(
              `/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z$/`,
            ),
          ],
        },
      ),
    ),
  )
}
