import ts from "typescript"
import { Model } from "../../parseSamenApp"
import generateParserFromModel from "./../parsers/generateParserFromModel"
import generateParserModel from "./../parsers/generateParserModel"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const staticModifier = ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)

export default function generateModelParser(
  model: Model,
  typeChecker: ts.TypeChecker,
): ts.ClassDeclaration {
  const modelName = model.name.escapedText
  return ts.factory.createClassDeclaration(
    undefined,
    [exportModifier],
    `${modelName}Parser`,
    undefined,
    undefined,
    [
      ts.factory.createMethodDeclaration(
        undefined,
        [staticModifier],
        undefined,
        "parse",
        undefined,
        undefined,
        [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            undefined,
            "data",
            undefined,
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            undefined,
          ),
        ],
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier("ParseResult"),
          [ts.factory.createTypeReferenceNode(model.name, undefined)],
        ),
        generateParserBody(model, typeChecker),
      ),
    ],
  )
}

function generateParserBody(
  model: Model,
  typeChecker: ts.TypeChecker,
): ts.Block {
  const sts: ts.Statement[] = [
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("errors"),
            undefined,
            ts.factory.createArrayTypeNode(
              ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier("ValidationError"),
                undefined,
              ),
            ),
            ts.factory.createArrayLiteralExpression([], false),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("result"),
            undefined,
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            undefined,
          ),
        ],
        ts.NodeFlags.Let,
      ),
    ),
  ]

  sts.push(
    generateParserFromModel(generateParserModel(typeChecker, model, "data")),
  )

  sts.push(
    ts.factory.createIfStatement(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("errors"),
        ts.factory.createIdentifier("length"),
      ),
      ts.factory.createBlock(
        [
          ts.factory.createReturnStatement(
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("ok"),
                  ts.factory.createFalse(),
                ),
                ts.factory.createShorthandPropertyAssignment(
                  ts.factory.createIdentifier("errors"),
                  undefined,
                ),
              ],
              true,
            ),
          ),
        ],
        true,
      ),
      undefined,
    ),
    ts.factory.createReturnStatement(
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("ok"),
            ts.factory.createTrue(),
          ),
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("result"),
            ts.factory.createAsExpression(
              ts.factory.createIdentifier("result"),
              ts.factory.createTypeReferenceNode(model.name, undefined),
            ),
          ),
        ],
        true,
      ),
    ),
  )
  return ts.factory.createBlock(sts, true)
}
