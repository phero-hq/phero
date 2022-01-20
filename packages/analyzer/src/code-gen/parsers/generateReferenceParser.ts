import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { ParserModelType, ReferenceParserModel } from "./generateParserModel"
import { generateParserBody } from "./generateParser"
import generateParserFromModel from "./generateParserFromModel"
import { capitalize } from "../../utils"

export default function generateReferenceParser(
  pointer: Pointer<ReferenceParserModel>,
): ts.Statement {
  const hasNoTypeArgs = pointer.model.typeArguments.length === 0
  return ts.factory.createIfStatement(
    hasNoTypeArgs
      ? generateReferenceValidator(pointer)
      : generateReferenceValidatorWithTypeArguments(pointer),
    // TODO populate the errors with the actual errors
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      `not a ${pointer.model.typeName}`,
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
          ts.factory.createIdentifier(
            capitalize(`${pointer.model.baseTypeName}Parser`),
          ),
          ts.factory.createIdentifier("parse"),
        ),
        undefined,
        [pointer.dataVarExpr],
      ),
      ts.factory.createIdentifier("ok"),
    ),
  )
}

function generateReferenceValidatorWithTypeArguments(
  pointer: Pointer<ReferenceParserModel>,
): ts.Expression {
  return ts.factory.createPrefixUnaryExpression(
    ts.SyntaxKind.ExclamationToken,
    ts.factory.createPropertyAccessExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier(
            capitalize(`${pointer.model.baseTypeName}Parser`),
          ),
          ts.factory.createIdentifier("parse"),
        ),
        pointer.model.typeArguments.map((typeArg) =>
          ts.factory.createTypeReferenceNode(
            ts.factory.createIdentifier(typeArg.typeName),
            undefined,
          ),
        ),
        [
          pointer.dataVarExpr,
          ...(pointer.model.typeArguments?.map((param) =>
            param.parser.type === ParserModelType.TypeParameter
              ? param.parser.defaultParser
                ? ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier(`t${param.parser.position}`),
                    ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                    generateInlineTypeParameterParser(
                      param.typeName,
                      generateParserFromModel(
                        param.parser.defaultParser.parser,
                        [
                          {
                            type: ParserModelType.Root,
                            name: "data",
                            parser: param.parser.defaultParser.parser,
                          },
                        ],
                      ),
                    ),
                  )
                : ts.factory.createIdentifier(`t${param.parser.position}`)
              : generateInlineTypeParameterParser(
                  param.typeName,
                  generateParserFromModel(param.parser, [
                    {
                      type: ParserModelType.Root,
                      name: "data",
                      parser: pointer.model,
                    },
                  ]),
                ),
          ) ?? []),
        ],
      ),
      ts.factory.createIdentifier("ok"),
    ),
  )
}

export function generateInlineTypeParameterParser(
  returnTypeString: string,
  parser: ts.Statement,
) {
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        ts.factory.createIdentifier("data"),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        undefined,
      ),
    ],
    ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier("ParseResult"),
      [
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier(returnTypeString),
          undefined,
        ),
      ],
    ),
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    generateParserBody(returnTypeString, parser),
  )
}
