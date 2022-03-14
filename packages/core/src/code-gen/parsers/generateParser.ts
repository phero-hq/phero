import ts from "typescript"
import { getReturnType } from "../../extractFunctionFromServiceProperty"
import { capitalize } from "../../utils"
import generateParserFromModel from "./../parsers/generateParserFromModel"
import generateParserModel from "./../parsers/generateParserModel"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const staticModifier = ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)

export default function generateModelParser(
  model: ts.Node,
  typeChecker: ts.TypeChecker,
): ts.ClassDeclaration {
  const rootParserModel = generateParserModel(typeChecker, model, "data")
  if (!rootParserModel.rootTypeParser) {
    throw new Error("Expected rootTypeParser")
  }

  const parserStatement: ts.Statement = generateParserFromModel(rootParserModel)

  const parserName = capitalize(
    `${rootParserModel.rootTypeParser.baseTypeName}Parser`,
  )

  return ts.factory.createClassDeclaration(
    undefined,
    [exportModifier],
    parserName,
    undefined,
    undefined,
    [
      ts.factory.createMethodDeclaration(
        undefined,
        [staticModifier],
        undefined,
        "parse",
        undefined,
        rootParserModel.rootTypeParser.typeParameters.map((p) =>
          ts.factory.createTypeParameterDeclaration(p.typeName),
        ),
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
          ...rootParserModel.rootTypeParser.typeParameters.map(
            (typeParam, position) =>
              ts.factory.createParameterDeclaration(
                undefined,
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
          rootParserModel.rootTypeParser.typeName,
          parserStatement,
        ),
      ),
    ],
  )
}

export function generateParserBody(
  returnTypeString: string,
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
                ts.factory.createTypeReferenceNode(returnTypeString, undefined),
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

  throw new Error(`Function has unsupported name`)
}

export function generateRPCParser(
  func: ts.FunctionLikeDeclarationBase,
  typeChecker: ts.TypeChecker,
): ts.ClassDeclaration {
  if (!func.type) {
    throw new Error("Function should have return type")
  }

  const intputParserModel = generateParserModel(typeChecker, func, "data")

  const outputParserModel = generateParserModel(
    typeChecker,
    getReturnType(func),
    "data",
  )

  const inputParserStatement: ts.Statement = generateParserFromModel(
    generateParserModel(typeChecker, func, "data"),
  )
  const outputParserStatement: ts.Statement =
    generateParserFromModel(outputParserModel)

  // console.log("input")
  // console.log(printCode(inputParserStatement))
  // console.log("output")
  // console.log(printCode(outputParserStatement))

  const parserName = capitalize(`${getFunctionName(func.name)}Parser`)

  return ts.factory.createClassDeclaration(
    undefined,
    undefined,
    parserName,
    undefined,
    undefined,
    [],
  )
  // return ts.factory.createClassDeclaration(
  //   undefined,
  //   [exportModifier],
  //   parserName,
  //   undefined,
  //   undefined,
  //   [
  //     ts.factory.createMethodDeclaration(
  //       undefined,
  //       [staticModifier],
  //       undefined,
  //       "parse",
  //       undefined,
  //       undefined,
  //       [
  //         ts.factory.createParameterDeclaration(
  //           undefined,
  //           undefined,
  //           undefined,
  //           "data",
  //           undefined,
  //           ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
  //           undefined,
  //         ),
  //       ],
  //       ts.factory.createTypeReferenceNode(
  //         ts.factory.createIdentifier("ParseResult"),
  //         [
  //           ts.factory.createTypeReferenceNode(
  //             rootParserModel.rootTypeParser.typeName,
  //             undefined,
  //           ),
  //         ],
  //       ),
  //       generateParserBody(
  //         rootParserModel.rootTypeParser.typeName,
  //         parserStatement,
  //       ),
  //     ),
  //   ],
  // )
}
