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

import * as tsx from "../tsx"

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
  return tsx.function({
    export: true,
    async: true,
    name: `rpc_executor_${serviceName}__${funcDef.name}`,
    params: [tsx.param({ name: "input", type: tsx.type.any })],
    returnType: tsx.type.reference({
      name: "Promise",
      args: [tsx.type.reference({ name: "RPCResult", args: [tsx.type.any] })],
    }),
    body: [
      tsx.const({ name: "v3", init: tsx.literal.true }),

      tsx.const({
        name: "inputParser",
        init: generateInlineParser({
          returnType: tsx.type.any,
          parser: generateParserFromModel(
            generateParserModel(typeChecker, funcDef.actualFunction, "data"),
          ),
        }),
      }),

      tsx.const({
        name: "inputParseResult",
        init: tsx.expression.call("inputParser", { args: ["input"] }),
      }),

      tsx.const({
        name: "outputParser",
        init: generateInlineParser({
          returnType: tsx.type.any,
          parser: generateParserFromModel(
            generateParserModel(
              typeChecker,
              getReturnType(funcDef.actualFunction),
              "data",
            ),
          ),
        }),
      }),

      generateIfParseResultNotOkayEarlyReturn({
        parseResult: "inputParseResult",
      }),

      generateRPCFunctionCall({ serviceName, funcDef }),
    ],
  })
}

function generateInlineParser({
  returnType,
  parser,
}: {
  returnType: ts.TypeNode
  parser: ts.Statement
}): ts.ArrowFunction {
  return tsx.arrowFunction({
    params: [tsx.param({ name: "data", type: tsx.type.any })],
    returnType: tsx.type.reference({
      name: "ParseResult",
      args: [returnType],
    }),
    body: generateParserBody(returnType, parser),
  })
}

function generateRPCFunctionCall({
  serviceName,
  funcDef,
}: {
  serviceName: string
  funcDef: ParsedSamenFunctionDefinition
}) {
  return tsx.statement.try({
    block: [
      tsx.const({
        name: "output",
        init: tsx.expression.await(
          tsx.expression.call(
            tsx.expression.propertyAccess(
              serviceName,
              "functions",
              funcDef.name,
              "func",
            ),
            {
              args: funcDef.parameters.map((param) =>
                tsx.expression.propertyAccess(
                  "inputParseResult",
                  "result",
                  getParameterName(param.name),
                ),
              ),
            },
          ),
        ),
      }),

      tsx.const({
        name: "outputParseResult",
        init: tsx.expression.call("outputParser", { args: ["output"] }),
      }),

      generateIfParseResultNotOkayEarlyReturn({
        parseResult: "outputParseResult",
      }),

      generateReturnOkay(),
    ],
    catch: {
      error: "error",
      block: [
        tsx.statement.return(
          tsx.literal.object(
            tsx.property.assignment("status", tsx.literal.number(500)),
            tsx.property.shorthandAssignment("error"),
          ),
        ),
      ],
    },
  })
}

function generateIfParseResultNotOkayEarlyReturn({
  parseResult,
}: {
  parseResult: "inputParseResult" | "outputParseResult"
}) {
  return tsx.statement.if({
    expression: tsx.expression.binary(
      tsx.expression.propertyAccess(parseResult, "ok"),
      "===",
      tsx.literal.false,
    ),
    then: tsx.statement.block(
      tsx.statement.return(
        tsx.literal.object(
          tsx.property.assignment("status", tsx.literal.number(400)),
          tsx.property.assignment(
            "errors",
            tsx.expression.propertyAccess(parseResult, "errors"),
          ),
        ),
      ),
    ),
  })
}

function generateReturnOkay() {
  return tsx.statement.return(
    tsx.literal.object(
      tsx.property.assignment("status", tsx.literal.number(200)),
      tsx.property.assignment(
        "result",
        tsx.expression.propertyAccess("outputParseResult", "result"),
      ),
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
