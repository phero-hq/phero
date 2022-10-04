import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { ParserModelType, ReferenceParserModel } from "./generateParserModel"
import { generateParserBody } from "./generateParser"
import generateParserFromModel from "./generateParserFromModel"
import * as tsx from "../../tsx"

export default function generateReferenceParser(
  pointer: Pointer<ReferenceParserModel>,
): ts.Statement {
  const parseResultName = `parseResult`
  return tsx.block(
    tsx.const({
      name: parseResultName,
      init: generateParserCall(pointer),
    }),
    tsx.statement.if({
      expression: tsx.expression.negate(
        tsx.expression.propertyAccess(parseResultName, "ok"),
      ),
      // TODO populate the errors with the actual errors
      then: generatePushErrorExpressionStatement(
        pointer.errorPath,
        `not a ${pointer.model.typeName}`,
      ),
      else: assignDataToResult(
        pointer.resultVarExpr,
        tsx.expression.propertyAccess(parseResultName, "result"),
      ),
    }),
  )
}

function generateParserCall(
  pointer: Pointer<ReferenceParserModel>,
): ts.CallExpression {
  if (pointer.model.typeArguments.length === 0) {
    return tsx.expression.call(
      tsx.expression.propertyAccess(
        `${pointer.model.baseTypeName}Parser`,
        "parse",
      ),
      { args: [pointer.dataVarExpr] },
    )
  } else {
    return ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(`${pointer.model.baseTypeName}Parser`),
        ts.factory.createIdentifier("parse"),
      ),
      pointer.model.typeArguments.map((typeArg) =>
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier(
            typeArg.fullyQualifiedName?.full ?? typeArg.typeName,
          ),
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
                    param.fullyQualifiedName?.full ?? param.typeName,
                    generateParserFromModel(param.parser.defaultParser.parser, [
                      {
                        type: ParserModelType.Root,
                        name: "data",
                        parser: param.parser.defaultParser.parser,
                      },
                    ]),
                  ),
                )
              : ts.factory.createIdentifier(`t${param.parser.position}`)
            : generateInlineTypeParameterParser(
                param.fullyQualifiedName?.full ?? param.typeName,
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
    )
  }
}

export function generateInlineTypeParameterParser(
  returnTypeString: string,
  parser: ts.Statement,
): ts.ArrowFunction {
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [
      ts.factory.createParameterDeclaration(
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
    generateParserBody(
      ts.factory.createTypeReferenceNode(returnTypeString),
      parser,
    ),
  )
}
