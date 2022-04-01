import ts from "typescript"
import { renderAST } from "@samen/ts-renderer"
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
  return renderAST(
    <ts-function
      name={`rpc_executor_${serviceName}__${funcDef.name}`}
      params={[<ts-parameter name="input" type={<ts-any />} />]}
      returnType={
        <ts-type-reference
          name="Promise"
          args={[<ts-type-reference name="RPCResult" args={[<ts-any />]} />]}
        />
      }
    >
      <ts-const name="v2" init={<ts-true />} />
      <ts-const
        name="inputParser"
        init={
          <InlineParser
            returnTypeString="any"
            parser={generateParserFromModel(
              generateParserModel(typeChecker, funcDef.actualFunction, "data"),
            )}
          />
        }
      />
      <ts-const
        name="inputParseResult"
        init={<ts-call-expression name="inputParser" args={["input"]} />}
      />
      <ts-const
        name="outputParser"
        init={
          <InlineParser
            returnTypeString="any"
            parser={generateParserFromModel(
              generateParserModel(
                typeChecker,
                getReturnType(funcDef.actualFunction),
                "data",
              ),
            )}
          />
        }
      />
      <EarlyReturnParseResultNotOkay parseResult="inputParseResult" />
      <CallRPCFunction serviceName={serviceName} funcDef={funcDef} />
    </ts-function>,
  )
}

function InlineParser({
  returnTypeString,
  parser,
}: {
  returnTypeString: string
  parser: ts.Statement
}) {
  return (
    <ts-arrow-function
      params={[<ts-parameter name="data" type={<ts-any />} />]}
      returnType={
        <ts-type-reference
          name="ParseResult"
          args={[<ts-type-reference name={returnTypeString} />]}
        />
      }
      body={<ts-node node={generateParserBody(returnTypeString, parser)} />}
    />
  )
}

function CallRPCFunction({
  serviceName,
  funcDef,
}: {
  serviceName: string
  funcDef: ParsedSamenFunctionDefinition
}) {
  return (
    <ts-try>
      <ts-block>
        <ts-const
          name="output"
          init={
            <ts-await>
              <ts-call-expression
                name={`${serviceName}.${funcDef.name}.func`}
                args={funcDef.parameters.map((param) => (
                  <ts-property-access-expression
                    chain={`inputParseResult.result.${getParameterName(
                      param.name,
                    )}`}
                  />
                ))}
              />
            </ts-await>
          }
        />
        <ts-const
          name="outputParseResult"
          init={<ts-call-expression name="outputParser" args={["output"]} />}
        />
        <EarlyReturnParseResultNotOkay parseResult="outputParseResult" />

        <ReturnOkay />
      </ts-block>
      <ts-catch errorName="error">
        <ts-return
          expression={
            <ts-object-literal>
              <ts-property-assignment
                name="status"
                init={<ts-number-literal value={500} />}
              />
              <ts-shorthand-property-assignment name="error" />
            </ts-object-literal>
          }
        />
      </ts-catch>
    </ts-try>
  )
}

function EarlyReturnParseResultNotOkay({
  parseResult,
}: {
  parseResult: "inputParseResult" | "outputParseResult"
}) {
  return (
    <ts-if
      expression={
        <ts-binary-expression
          left={<ts-property-access-expression chain={`${parseResult}.ok`} />}
          op="==="
          right={<ts-false />}
        />
      }
      then={
        <ts-block>
          <ts-return
            expression={
              <ts-object-literal>
                <ts-property-assignment
                  name="status"
                  init={<ts-number-literal value={400} />}
                />
                <ts-property-assignment
                  name="errors"
                  init={
                    <ts-property-access-expression
                      chain={`${parseResult}.errors`}
                    />
                  }
                />
              </ts-object-literal>
            }
          />
        </ts-block>
      }
    />
  )
}

function ReturnOkay() {
  return (
    <ts-return
      expression={
        <ts-object-literal>
          <ts-property-assignment
            name="status"
            init={<ts-number-literal value={200} />}
          />
          <ts-property-assignment
            name="result"
            init={
              <ts-property-access-expression
                chain={`outputParserResult.result`}
              />
            }
          />
        </ts-object-literal>
      }
    />
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
