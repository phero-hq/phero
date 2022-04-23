import ts from "typescript"
import generateParserFromModel from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import {
  ParserModelType,
  TypeParameterParserModel,
} from "./generateParserModel"
import { generateInlineTypeParameterParser } from "./generateReferenceParser"
import Pointer from "./Pointer"
import * as tsx from "../../tsx"

export default function generateTypeParameterParser(
  pointer: Pointer<TypeParameterParserModel>,
): ts.Statement {
  const tParamName = `t${pointer.model.position}`
  const tResultName = `${tParamName}_result`

  return tsx.block(
    tsx.const({
      name: tResultName,
      init: tsx.expression.call(
        pointer.model.defaultParser
          ? tsx.expression.parenthesis(
              tsx.expression.binary(
                ts.factory.createIdentifier(tParamName),
                "??",
                generateInlineTypeParameterParser(
                  pointer.model.defaultParser.typeName,
                  generateParserFromModel(pointer.model.defaultParser.parser, [
                    {
                      type: ParserModelType.Root,
                      name: "data",
                      parser: pointer.model.defaultParser.parser,
                    },
                  ]),
                ),
              ),
            )
          : tsx.expression.identifier(tParamName),
        { args: [pointer.dataVarExpr] },
      ),
    }),

    tsx.statement.if({
      expression: tsx.expression.negate(
        tsx.expression.propertyAccess(tResultName, "ok"),
      ),
      // TODO populate the errors with the actual errors
      then: generatePushErrorExpressionStatement(
        pointer.errorPath,
        `not a ${pointer.model.typeName}`,
      ),
      else: assignDataToResult(
        pointer.resultVarExpr,
        tsx.expression.propertyAccess(tResultName, "result"),
      ),
    }),
  )
}
