import ts from "typescript"
import { ParseError } from "../../domain/errors"
import { Model } from "../../domain/PheroApp"
import * as tsx from "../../tsx"
import generateParserFromModel from "./../parsers/generateParserFromModel"
import generateParserModel from "./../parsers/generateParserModel"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const staticModifier = ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)

export function generateModelParser(
  model: Model,
  prog: ts.Program,
): ts.ClassDeclaration {
  const rootParserModel = generateParserModel(model, "data", prog)
  if (!rootParserModel.rootTypeParser) {
    throw new ParseError("S141: Expected rootTypeParser", model)
  }

  const parserStatement: ts.Statement = generateParserFromModel(rootParserModel)

  const parserName = `${rootParserModel.rootTypeParser.baseTypeName}Parser`

  return ts.factory.createClassDeclaration(
    [exportModifier],
    parserName,
    undefined,
    undefined,
    [
      ts.factory.createMethodDeclaration(
        [staticModifier],
        undefined,
        "parse",
        undefined,
        rootParserModel.rootTypeParser.typeParameters.map((p) =>
          ts.factory.createTypeParameterDeclaration(undefined, p.typeName),
        ),
        [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            "data",
            undefined,
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            undefined,
          ),
          ...rootParserModel.rootTypeParser.typeParameters.map(
            (typeParam, position) =>
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier(`t${position}`),
                typeParam.defaultParser
                  ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                  : undefined,
                ts.factory.createFunctionTypeNode(
                  undefined,
                  [
                    ts.factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      ts.factory.createIdentifier("data"),
                      undefined,
                      ts.factory.createKeywordTypeNode(
                        ts.SyntaxKind.AnyKeyword,
                      ),
                      undefined,
                    ),
                  ],
                  ts.factory.createTypeReferenceNode(
                    ts.factory.createIdentifier("ParseResult"),
                    [
                      ts.factory.createTypeReferenceNode(
                        ts.factory.createIdentifier(typeParam.typeName),
                        undefined,
                      ),
                    ],
                  ),
                ),
                undefined,
              ),
          ),
        ],
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier("ParseResult"),
          [
            ts.factory.createTypeReferenceNode(
              rootParserModel.rootTypeParser.typeName,
              undefined,
            ),
          ],
        ),
        generateParserBody(
          ts.factory.createTypeReferenceNode(
            rootParserModel.rootTypeParser.typeName,
          ),
          parserStatement,
        ),
      ),
    ],
  )
}

export function generateParserBody(
  returnType: ts.TypeNode,
  parserStatement: ts.Statement,
): ts.Block {
  return ts.factory.createBlock(
    [
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

      parserStatement,

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
                returnType,
              ),
            ),
          ],
          true,
        ),
      ),
    ],
    true,
  )
}

export function getFunctionName(name?: ts.PropertyName): string {
  if (!name) {
    throw new Error(`Function has no name`)
  }
  if (ts.isIdentifier(name)) {
    return name.text
  }
  if (ts.isStringLiteral(name)) {
    return name.text
  }

  throw new ParseError(`S142: Function has unsupported name`, name)
}

export function generateNonModelParser(
  type: ts.TypeNode,
  prog: ts.Program,
  parserName: string,
): ts.FunctionDeclaration {
  const rootParserModel = generateParserModel(type, "data", prog)
  const parserStatement: ts.Statement = generateParserFromModel(rootParserModel)

  return tsx.function({
    name: parserName,
    params: [tsx.param({ name: "data", type: tsx.type.any })],
    returnType: tsx.type.reference({
      name: "ParseResult",
      args: [type],
    }),
    body: generateParserBody(type, parserStatement),
  })
}

export function generateInlineParser(
  returnType: ts.TypeNode,
  model: ts.Node,
  prog: ts.Program,
): ts.ArrowFunction {
  const parser = generateParserFromModel(
    generateParserModel(model, "data", prog),
  )
  return tsx.arrowFunction({
    params: [tsx.param({ name: "data", type: tsx.type.any })],
    returnType: tsx.type.reference({
      name: "ParseResult",
      args: [returnType],
    }),
    body: generateParserBody(returnType, parser),
  })
}
