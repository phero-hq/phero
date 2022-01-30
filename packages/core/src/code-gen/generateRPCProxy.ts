import ts from "typescript"
import { ParsedSamenApp } from ".."
import { getReturnType } from "../extractFunctionFromServiceProperty"
import { ParsedSamenFunctionDefinition } from "../parseSamenApp"
import { printCode } from "../tsTestUtils"
import { VirtualCompilerHost } from "../VirtualCompilerHost"
import generateModelParser, {
  generateParserBody,
} from "./parsers/generateParser"
import generateParserFromModel from "./parsers/generateParserFromModel"
import generateParserModel from "./parsers/generateParserModel"

const factory = ts.factory

export default function generateRPCProxy(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
): { js: string } {
  const tsNodes: ts.Node[] = []

  for (const service of app.services) {
    tsNodes.push(
      factory.createImportDeclaration(
        undefined,
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(
              false,
              undefined,
              factory.createIdentifier(service.name),
            ),
          ]),
        ),
        factory.createStringLiteral("./samen"),
        undefined,
      ),
    )
  }

  tsNodes.push(...types)

  for (const domainModel of app.models) {
    tsNodes.push(domainModel)
    tsNodes.push(generateModelParser(domainModel, typeChecker))
  }

  for (const service of app.services) {
    for (const serviceModel of service.models) {
      tsNodes.push(serviceModel)
      tsNodes.push(generateModelParser(serviceModel, typeChecker))
    }

    for (const serviceFunction of service.funcs) {
      tsNodes.push(
        generateRPCExecutor(service.name, serviceFunction, typeChecker),
      )
    }
  }

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const file = ts.createSourceFile(
    "samen-execution.ts",
    "",
    ts.ScriptTarget.ES5,
    false,
    ts.ScriptKind.TS,
  )

  const tsSamenExecution = printer.printList(
    ts.ListFormat.SourceFileStatements,
    ts.factory.createNodeArray(tsNodes),
    file,
  )

  const vHost = new VirtualCompilerHost({
    declaration: false,
  })
  vHost.addFile("samen-execution.ts", tsSamenExecution)

  const prog = vHost.createProgram("samen-execution.ts")

  prog.emit()

  const js = vHost.getFile("samen-execution.js")

  if (!js) {
    throw new Error("Some error in generated TS.")
  }

  return { js }
}

function generateRPCExecutor(
  serviceName: string,
  funcDef: ParsedSamenFunctionDefinition,
  typeChecker: ts.TypeChecker,
): ts.FunctionDeclaration {
  return factory.createFunctionDeclaration(
    undefined,
    [
      factory.createModifier(ts.SyntaxKind.ExportKeyword),
      factory.createModifier(ts.SyntaxKind.AsyncKeyword),
    ],
    undefined,
    factory.createIdentifier(`rpc_executor_${serviceName}__${funcDef.name}`),
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier("input"),
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        undefined,
      ),
    ],
    factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
      factory.createTypeReferenceNode(factory.createIdentifier("RPCResult"), [
        factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      ]),
    ]),
    factory.createBlock(
      [
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                factory.createIdentifier("inputParser"),
                undefined,
                undefined,
                generateInlineParser(
                  "any",
                  generateParserFromModel(
                    generateParserModel(
                      typeChecker,
                      funcDef.actualFunction,
                      "data",
                    ),
                  ),
                ),
              ),

              factory.createVariableDeclaration(
                factory.createIdentifier("inputParseResult"),
                undefined,
                undefined,
                factory.createCallExpression(
                  factory.createIdentifier("inputParser"),
                  undefined,
                  [factory.createIdentifier("input")],
                ),
              ),

              factory.createVariableDeclaration(
                factory.createIdentifier("outputParser"),
                undefined,
                undefined,
                generateInlineParser(
                  "any",
                  generateParserFromModel(
                    generateParserModel(
                      typeChecker,
                      getReturnType(funcDef.actualFunction),
                      "data",
                    ),
                  ),
                ),
              ),
            ],
            ts.NodeFlags.Const |
              ts.NodeFlags.AwaitContext |
              ts.NodeFlags.ContextFlags |
              ts.NodeFlags.TypeExcludesFlags,
          ),
        ),
        factory.createIfStatement(
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("inputParseResult"),
              factory.createIdentifier("ok"),
            ),
            factory.createToken(ts.SyntaxKind.EqualsEqualsToken),
            factory.createFalse(),
          ),
          factory.createBlock(
            [
              factory.createReturnStatement(
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      factory.createIdentifier("status"),
                      factory.createNumericLiteral("400"),
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("errors"),
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier("inputParseResult"),
                        factory.createIdentifier("errors"),
                      ),
                    ),
                  ],
                  false,
                ),
              ),
            ],
            true,
          ),
          undefined,
        ),
        factory.createTryStatement(
          factory.createBlock(
            [
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("output"),
                      undefined,
                      undefined,
                      factory.createAwaitExpression(
                        factory.createCallExpression(
                          factory.createIdentifier(
                            `${serviceName}.${funcDef.name}.func`,
                          ),
                          undefined,
                          funcDef.parameters.map((param) =>
                            factory.createPropertyAccessExpression(
                              factory.createPropertyAccessExpression(
                                factory.createIdentifier("inputParseResult"),
                                factory.createIdentifier("result"),
                              ),
                              factory.createIdentifier(
                                getParameterName(param.name),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  ts.NodeFlags.Const |
                    ts.NodeFlags.AwaitContext |
                    ts.NodeFlags.ContextFlags |
                    ts.NodeFlags.TypeExcludesFlags,
                ),
              ),
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("outputParseResult"),
                      undefined,
                      undefined,
                      factory.createCallExpression(
                        factory.createIdentifier("outputParser"),
                        undefined,
                        [factory.createIdentifier("output")],
                      ),
                    ),
                  ],
                  ts.NodeFlags.Const |
                    ts.NodeFlags.AwaitContext |
                    ts.NodeFlags.ContextFlags |
                    ts.NodeFlags.TypeExcludesFlags,
                ),
              ),
              factory.createIfStatement(
                factory.createBinaryExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("outputParseResult"),
                    factory.createIdentifier("ok"),
                  ),
                  factory.createToken(ts.SyntaxKind.EqualsEqualsToken),
                  factory.createFalse(),
                ),
                factory.createBlock(
                  [
                    factory.createReturnStatement(
                      factory.createObjectLiteralExpression(
                        [
                          factory.createPropertyAssignment(
                            factory.createIdentifier("status"),
                            factory.createNumericLiteral("400"),
                          ),
                          factory.createPropertyAssignment(
                            factory.createIdentifier("errors"),
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier("outputParseResult"),
                              factory.createIdentifier("errors"),
                            ),
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
              factory.createReturnStatement(
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      factory.createIdentifier("status"),
                      factory.createNumericLiteral("200"),
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("result"),
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier("outputParseResult"),
                        factory.createIdentifier("result"),
                      ),
                    ),
                  ],
                  false,
                ),
              ),
            ],
            true,
          ),
          factory.createCatchClause(
            factory.createVariableDeclaration(
              factory.createIdentifier("error"),
              undefined,
              undefined,
              undefined,
            ),
            factory.createBlock(
              [
                factory.createReturnStatement(
                  factory.createObjectLiteralExpression(
                    [
                      factory.createPropertyAssignment(
                        factory.createIdentifier("status"),
                        factory.createNumericLiteral("500"),
                      ),
                      factory.createShorthandPropertyAssignment(
                        factory.createIdentifier("error"),
                        undefined,
                      ),
                    ],
                    false,
                  ),
                ),
              ],
              true,
            ),
          ),
          undefined,
        ),
      ],
      true,
    ),
  )
}

function getParameterName(name: ts.BindingName): string {
  if (ts.isIdentifier(name)) {
    return name.text
  } else if (ts.isBindingName(name)) {
    throw new Error(`No support for binding names ${printCode(name)}`)
  }

  throw new Error("Name not supported")
}

// TODO Copied from: generateInlineTypeParameterParser
function generateInlineParser(returnTypeString: string, parser: ts.Statement) {
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

const types = [
  factory.createTypeAliasDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("ParseResult"),
    [
      factory.createTypeParameterDeclaration(
        factory.createIdentifier("T"),
        undefined,
        undefined,
      ),
    ],
    factory.createUnionTypeNode([
      factory.createTypeReferenceNode(
        factory.createIdentifier("ParseResultSuccess"),
        [
          factory.createTypeReferenceNode(
            factory.createIdentifier("T"),
            undefined,
          ),
        ],
      ),
      factory.createTypeReferenceNode(
        factory.createIdentifier("ParseResultFailure"),
        undefined,
      ),
    ]),
  ),
  factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("ParseResultSuccess"),
    [
      factory.createTypeParameterDeclaration(
        factory.createIdentifier("T"),
        undefined,
        undefined,
      ),
    ],
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("ok"),
        undefined,
        factory.createLiteralTypeNode(factory.createTrue()),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("result"),
        undefined,
        factory.createTypeReferenceNode(
          factory.createIdentifier("T"),
          undefined,
        ),
      ),
    ],
  ),
  factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("ParseResultFailure"),
    undefined,
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("ok"),
        undefined,
        factory.createLiteralTypeNode(factory.createFalse()),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("errors"),
        undefined,
        factory.createArrayTypeNode(
          factory.createTypeReferenceNode(
            factory.createIdentifier("ValidationError"),
            undefined,
          ),
        ),
      ),
    ],
  ),
  factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("ValidationError"),
    undefined,
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("path"),
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("message"),
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ),
    ],
  ),
  factory.createTypeAliasDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("RPCResult"),
    [
      factory.createTypeParameterDeclaration(
        factory.createIdentifier("T"),
        undefined,
        undefined,
      ),
    ],
    factory.createUnionTypeNode([
      factory.createTypeReferenceNode(factory.createIdentifier("RPCOkResult"), [
        factory.createTypeReferenceNode(
          factory.createIdentifier("T"),
          undefined,
        ),
      ]),
      factory.createTypeReferenceNode(
        factory.createIdentifier("RPCBadRequestResult"),
        undefined,
      ),
      factory.createTypeReferenceNode(
        factory.createIdentifier("RPCInternalServerErrorResult"),
        undefined,
      ),
    ]),
  ),
  factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("RPCOkResult"),
    [
      factory.createTypeParameterDeclaration(
        factory.createIdentifier("T"),
        undefined,
        undefined,
      ),
    ],
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("status"),
        undefined,
        factory.createLiteralTypeNode(factory.createNumericLiteral("200")),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("result"),
        undefined,
        factory.createTypeReferenceNode(
          factory.createIdentifier("T"),
          undefined,
        ),
      ),
    ],
  ),
  factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("RPCBadRequestResult"),
    undefined,
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("status"),
        undefined,
        factory.createLiteralTypeNode(factory.createNumericLiteral("400")),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("errors"),
        undefined,
        factory.createArrayTypeNode(
          factory.createTypeReferenceNode(
            factory.createIdentifier("ValidationError"),
            undefined,
          ),
        ),
      ),
    ],
  ),
  factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier("RPCInternalServerErrorResult"),
    undefined,
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("status"),
        undefined,
        factory.createLiteralTypeNode(factory.createNumericLiteral("500")),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier("error"),
        undefined,
        factory.createTypeReferenceNode(
          factory.createIdentifier("Error"),
          undefined,
        ),
      ),
    ],
  ),
]
