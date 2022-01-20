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

export default function generateTypeParameterParser(
  pointer: Pointer<TypeParameterParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      ts.factory.createPropertyAccessExpression(
        ts.factory.createCallExpression(
          pointer.model.defaultParser
            ? ts.factory.createParenthesizedExpression(
                ts.factory.createBinaryExpression(
                  ts.factory.createIdentifier(`t${pointer.model.position}`),
                  ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                  generateInlineTypeParameterParser(
                    pointer.model.defaultParser.typeName,
                    generateParserFromModel(
                      pointer.model.defaultParser.parser,
                      [
                        {
                          type: ParserModelType.Root,
                          name: "data",
                          parser: pointer.model.defaultParser.parser,
                        },
                      ],
                    ),
                  ),
                ),
              )
            : ts.factory.createIdentifier(`t${pointer.model.position}`),
          undefined,
          [pointer.dataVarExpr],
        ),

        ts.factory.createIdentifier("ok"),
      ),
    ),
    // TODO populate the errors with the actual errors
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      `not a ${pointer.model.typeName}`,
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}
