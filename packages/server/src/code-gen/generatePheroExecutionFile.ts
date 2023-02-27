import {
  cloneTS,
  DependencyRefs,
  generateDependencyRefs,
  generateInlineParser,
  generateModelParser,
  PheroApp,
  PheroError,
  PheroFunction,
  PheroService,
  tsx,
  VirtualCompilerHost,
} from "@phero/core"
import { generateErrorParser } from "@phero/core/dist/generateParser"
import ts from "typescript"

export default function generatePheroExecutionFile(app: PheroApp): {
  js: string
} {
  const tsNodes: ts.Node[] = []

  const serviceSourceFiles = app.services.reduce<Map<ts.SourceFile, string[]>>(
    (map, service) => {
      const serviceSourceFile = service.ref.getSourceFile()
      if (map.has(serviceSourceFile)) {
        map.get(serviceSourceFile)?.push(service.name)
      } else {
        map.set(serviceSourceFile, [service.name])
      }
      return map
    },
    new Map<ts.SourceFile, string[]>(),
  )

  tsNodes.push(
    tsx.importDeclaration({
      names: ["Parser", "ParseResult", "parser", "RPCResult", "DataParseError"],
      module: "@phero/server",
    }),
  )

  for (const [sourceFile, serviceNames] of serviceSourceFiles.entries()) {
    tsNodes.push(
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          false,
          undefined,
          ts.factory.createNamedImports(
            serviceNames.map((serviceName) =>
              ts.factory.createImportSpecifier(
                false,
                undefined,
                ts.factory.createIdentifier(serviceName),
              ),
            ),
          ),
        ),
        // TODO cleanup
        ts.factory.createStringLiteral(
          "." +
            sourceFile.fileName
              .substring(sourceFile.fileName.indexOf("src") + 3)
              .replace(".ts", ""),
        ),
        undefined,
      ),
    )
  }

  tsNodes.push(
    tsx.verbatim(`class ParseError extends Error {
  constructor(public readonly errors: DataParseError[], public readonly input: unknown) {
    super("ParseError")
    // https://github.com/microsoft/TypeScript/issues/22585
    Object.setPrototypeOf(this, ParseError.prototype)
  }
}

function defaultErrorMapper<T>(error: unknown): RPCResult<T> {
  if (error instanceof ParseError) {
    return { status: 400, input: error.input, errors: error.errors }
  } else if (error instanceof Error) {
    return {
      status: 500,
      error: {
        name: "Error",
        props: { message: error.message },
        stack: error.stack,
      },
    }
  } else {
    return {
      status: 500,
      error: {
        name: "Error",
        props: { message: "Internal Server Error" },
      },
    }
  }
}`),
  )

  const depRefs = generateDependencyRefs(app.deps)

  for (const domainModel of app.models) {
    tsNodes.push(cloneTS(domainModel.ref))
  }
  for (const [name, model] of [...app.deps]) {
    tsNodes.push(generateModelParser(name, model, depRefs))
  }
  for (const error of app.errors) {
    tsNodes.push(generateErrorParser(error, depRefs))
  }

  for (const service of app.services) {
    tsNodes.push(generateCorsConfigFunction(service))

    for (const serviceFunction of service.funcs) {
      tsNodes.push(
        generateRPCExecutor(service, serviceFunction, app.errors),
        generateInnerFunction(service, serviceFunction, depRefs),
      )
    }
  }

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const file = ts.createSourceFile(
    "phero-execution.ts",
    "",
    ts.ScriptTarget.ES2015, // TODO should respect the target of the user
    false,
    ts.ScriptKind.TS,
  )

  const tsPheroExecution = printer.printList(
    ts.ListFormat.SourceFileStatements,
    ts.factory.createNodeArray(tsNodes),
    file,
  )

  require("fs").writeFileSync(
    "/Users/kamilafsar/Projects/examples/web/server/src/out.ts",
    tsPheroExecution,
    { encoding: "utf8" },
  )

  const vHost = new VirtualCompilerHost({
    declaration: false,
  })
  vHost.addFile("phero-execution.ts", tsPheroExecution)

  const progExecution = vHost.createProgram("phero-execution.ts")

  progExecution.emit()

  const js = vHost.getFile("phero-execution.js")

  if (!js) {
    throw new Error("Some error in generated TS.")
  }

  return { js }
}

function generateCorsConfigFunction(
  service: PheroService,
): ts.FunctionDeclaration {
  return tsx.function({
    export: true,
    async: true,
    name: `service_cors_config__${service.name}`,
    returnType: tsx.type.reference({
      name: "Promise",
      args: [tsx.type.array(tsx.type.string)],
    }),
    params: [],
    body: [
      tsx.statement.return(
        tsx.expression.binary(
          tsx.expression.propertyAccess(
            service.name,
            "config",
            "cors?",
            "originWhitelist",
          ),
          "??",
          tsx.literal.array(),
        ),
      ),
    ],
  })
}

function generateRPCExecutor(
  service: PheroService,
  funcDef: PheroFunction,
  domainErrors: PheroError[],
): ts.FunctionDeclaration {
  return tsx.function({
    export: true,
    async: true,
    name: `rpc_executor_${service.name}__${funcDef.name}`,
    params: [
      tsx.param({
        name: "input",
        type: tsx.type.reference({
          name: "Record",
          args: [
            tsx.type.literalType(tsx.literal.string("context")),
            tsx.type.reference({
              name: "Record",
              args: [tsx.type.string, tsx.type.unknown],
            }),
          ],
        }),
      }),
    ],
    returnType: tsx.type.reference({
      name: "Promise",
      args: [
        tsx.type.reference({
          name: "RPCResult",
          args: [cloneTS(funcDef.returnType)],
        }),
      ],
    }),
    body: tsx.block(
      wrapWithErrorHandler(
        domainErrors,
        tsx.const({
          name: "result",
          init: tsx.expression.await(
            tsx.expression.call(
              `rpc_executor_${service.name}__${funcDef.name}__inner`,
              { args: ["input"] },
            ),
          ),
        }),

        tsx.statement.return(
          tsx.literal.object(
            tsx.property.assignment("status", tsx.literal.number(200)),
            tsx.property.shorthandAssignment("result"),
          ),
        ),
      ),
    ),
  })
}

const noopParser: ts.FunctionDeclaration = tsx.function({
  name: "noopParser",
  returnType: tsx.type.reference({
    name: "ParseResult",
    args: [
      tsx.type.reference({
        name: "Record",
        args: [tsx.type.string, tsx.type.unknown],
      }),
    ],
  }),
  params: [
    tsx.param({
      name: "data",
      type: tsx.type.reference({
        name: "Record",
        args: [tsx.type.string, tsx.type.unknown],
      }),
    }),
  ],
  body: [
    tsx.statement.return(
      tsx.literal.object(
        tsx.property.assignment("ok", tsx.literal.true),
        tsx.property.assignment("result", tsx.expression.identifier("data")),
      ),
    ),
  ],
})

function generateInnerFunction(
  service: PheroService,
  funcDef: PheroFunction,
  depRefs: DependencyRefs,
): ts.FunctionDeclaration {
  return tsx.function({
    name: `rpc_executor_${service.name}__${funcDef.name}__inner`,
    async: true,
    params: [
      tsx.param({
        name: "input",
        type: tsx.type.reference({
          name: "Record",
          args: [
            tsx.type.literalType(tsx.literal.string("context")),
            tsx.type.reference({
              name: "Record",
              args: [tsx.type.string, tsx.type.unknown],
            }),
          ],
        }),
      }),
    ],
    returnType: tsx.type.reference({
      name: "Promise",
      args: [cloneTS(funcDef.returnType)],
    }),
    body: tsx.block(
      tsx.statement.let({
        name: "output",
        type: tsx.type.union(cloneTS(funcDef.returnType), tsx.type.undefined),
      }),

      tsx.const({
        name: "inputParser",
        init: generateInlineParser(
          funcDef.parametersModel,
          tsx.literal.type(
            ...funcDef.parameters.map((p) =>
              tsx.property.signature(p.name, cloneTS(p.type), p.questionToken),
            ),
          ),
          depRefs,
        ),
      }),

      tsx.const({
        name: "contextParser",
        init:
          funcDef.contextType && funcDef.contextTypeModel
            ? generateInlineParser(
                funcDef.contextTypeModel,
                funcDef.contextType,
                depRefs,
              )
            : tsx.expression.identifier("noopParser"),
      }),

      tsx.const({
        name: "outputParser",
        init: generateInlineParser(
          funcDef.returnTypeModel,
          cloneTS(funcDef.returnType),
          depRefs,
        ),
      }),

      tsx.statement.let({
        name: "isFunctionCalled",
        init: tsx.literal.false,
      }),

      ...(service.funcs.some((f) => !f.contextType) ||
      service.config.middleware.some((m) => !m.contextType || !m.nextType)
        ? [noopParser]
        : []),

      ...service.config.middleware.reduceRight<ts.Statement[]>(
        (innerStatements, middleware, index) => {
          const middlewareFuncRef = tsx.expression.elementAccess(
            tsx.expression.propertyAccess(service.name, "config", "middleware"),
            tsx.literal.number(index),
          )

          const ctxParser = tsx.const({
            name: `ctx_parser_${index}`,
            init: middleware.contextType
              ? generateInlineParser(
                  middleware.contextTypeModel,
                  middleware.contextType,
                  depRefs,
                )
              : tsx.expression.identifier("noopParser"),
          })

          const nextParser = tsx.const({
            name: `next_parser_${index}`,
            init: middleware.nextType
              ? generateInlineParser(
                  middleware.nextTypeModel,
                  middleware.nextType,
                  depRefs,
                )
              : tsx.expression.identifier("noopParser"),
          })

          const callMiddlewareExpr = tsx.expression.await(
            tsx.expression.call(middlewareFuncRef, {
              args: [
                tsx.expression.propertyAccess(
                  `ctx_parseResult_${index}`,
                  "result",
                ),
                tsx.arrowFunction({
                  async: true,
                  params: [
                    tsx.param({
                      name: `next_${index}`,
                      questionToken: true,
                      type: tsx.type.unknown,
                    }),
                  ],
                  body: [
                    nextParser,
                    tsx.const({
                      name: `next_parseResult_${index}`,
                      init: tsx.expression.call(`next_parser_${index}`, {
                        args: [`next_${index}`],
                      }),
                    }),
                    generateIfParseResultNotOkayEarlyReturn({
                      input: `next_${index}`,
                      parseResult: `next_parseResult_${index}`,
                    }),
                    ...innerStatements,
                  ],
                }),
              ],
            }),
          )

          const callCheckFuncCalledExpr = tsx.statement.if({
            expression: tsx.expression.negate(
              tsx.expression.identifier("isFunctionCalled"),
            ),
            then: tsx.statement.throw(
              tsx.expression.new("Error", {
                args: [
                  tsx.literal.string(
                    `It looks like middleware with index ${index} doesn't call next. Or maybe you forgot to await the next function call?`,
                  ),
                ],
              }),
            ),
          })

          return [
            ctxParser,
            tsx.const({
              name: `ctx_${index}`,
              init: tsx.literal.object(
                ...(index === 0
                  ? [
                      tsx.property.spreadAssignment(
                        tsx.expression.propertyAccess("input", "context"),
                      ),
                    ]
                  : [
                      tsx.property.spreadAssignment(`ctx_${index - 1}`),
                      tsx.property.spreadAssignment(
                        tsx.expression.propertyAccess(
                          `next_parseResult_${index - 1}`,
                          "result",
                        ),
                      ),
                    ]),
              ),
            }),
            tsx.const({
              name: `ctx_parseResult_${index}`,
              init: tsx.expression.call(`ctx_parser_${index}`, {
                args: [`ctx_${index}`],
              }),
            }),
            generateIfParseResultNotOkayEarlyReturn({
              input: `ctx_${index}`,
              parseResult: `ctx_parseResult_${index}`,
            }),
            tsx.statement.expression(callMiddlewareExpr),
            callCheckFuncCalledExpr,
          ]
        },
        [
          tsx.const({
            name: `parsedContext`,
            init: tsx.literal.object(
              ...(service.config.middleware.length === 0
                ? []
                : [
                    tsx.property.spreadAssignment(
                      tsx.expression.identifier(
                        `ctx_${service.config.middleware.length - 1}`,
                      ),
                    ),
                    tsx.property.spreadAssignment(
                      tsx.expression.propertyAccess(
                        `next_parseResult_${
                          service.config.middleware.length - 1
                        }`,
                        "result",
                      ),
                    ),
                  ]),
            ),
          }),

          tsx.const({
            name: "contextParseResult",
            init: tsx.expression.call("contextParser", {
              args: ["parsedContext"],
            }),
          }),

          generateIfParseResultNotOkayEarlyReturn({
            parseResult: "contextParseResult",
            input: "parsedContext",
          }),

          tsx.const({
            name: "inputParseResult",
            init: tsx.expression.call("inputParser", {
              args: ["input"],
            }),
          }),

          generateIfParseResultNotOkayEarlyReturn({
            parseResult: "inputParseResult",
            input: "input",
          }),

          tsx.statement.expression(
            tsx.expression.binary(
              tsx.expression.identifier("output"),
              "=",
              tsx.expression.await(
                tsx.expression.call(
                  tsx.expression.propertyAccess(
                    service.name,
                    "functions",
                    funcDef.name,
                  ),
                  {
                    args: [
                      ...(funcDef.contextType
                        ? [
                            tsx.expression.propertyAccess(
                              "contextParseResult",
                              "result",
                            ),
                          ]
                        : []),
                      ...funcDef.parameters.map((param) =>
                        tsx.expression.propertyAccess(
                          "inputParseResult",
                          "result",
                          param.name,
                        ),
                      ),
                    ],
                  },
                ),
              ),
            ),
          ),

          tsx.statement.expression(
            tsx.expression.binary(
              tsx.expression.identifier("isFunctionCalled"),
              "=",
              tsx.literal.true,
            ),
          ),
        ],
      ),

      tsx.const({
        name: "outputParseResult",
        init: tsx.expression.call("outputParser", { args: ["output"] }),
      }),

      generateIfParseResultNotOkayEarlyReturn({
        parseResult: "outputParseResult",
        input: "output",
      }),

      generateReturnOkay(),
    ),
  })
}

function wrapWithErrorHandler(
  domainErrors: PheroError[],
  ...statements: ts.Statement[]
): ts.TryStatement {
  return tsx.statement.try({
    block: statements,
    catch: {
      error: "error",
      block: generateErrorParsingFunction(domainErrors),
    },
  })
}

function generateErrorParsingFunction(domainErrors: PheroError[]): ts.Block {
  function wrapErrorWithStatusObject(
    errorObj: ts.ObjectLiteralExpression,
  ): ts.ObjectLiteralExpression {
    return tsx.literal.object(
      tsx.property.assignment("status", tsx.literal.number(500)),
      tsx.property.assignment("error", errorObj),
    )
  }

  const fallbackSt: ts.IfStatement = tsx.statement.if({
    expression: tsx.expression.binary(
      tsx.expression.identifier("error"),
      "instanceof",
      tsx.expression.identifier("ParseError"),
    ),
    then: tsx.block(
      tsx.statement.return(
        tsx.literal.object(
          tsx.property.assignment("status", tsx.literal.number(400)),
          tsx.property.assignment(
            "input",
            tsx.expression.propertyAccess("error", "input"),
          ),
          tsx.property.assignment(
            "errors",
            tsx.expression.propertyAccess("error", "errors"),
          ),
        ),
      ),
    ),
  })

  const errorIfElseTree: ts.IfStatement = domainErrors.reduceRight(
    (elseSt: ts.IfStatement, error: PheroError) => {
      return tsx.statement.if({
        expression: tsx.expression.binary(
          tsx.expression.binary(
            tsx.expression.identifier("error"),
            "instanceof",
            tsx.expression.identifier("Error"),
          ),
          "&&",
          tsx.expression.binary(
            tsx.expression.propertyAccess("error", "constructor", "name"),
            "==",
            tsx.literal.string(error.name),
          ),
        ),
        then: tsx.block(
          tsx.const({
            name: "parsedError",
            init: tsx.expression.call(`${error.name}Parser`, {
              args: ["error"],
            }),
          }),
          tsx.statement.if({
            expression: tsx.expression.propertyAccess("parsedError", "ok"),
            then: tsx.statement.return(
              wrapErrorWithStatusObject(
                tsx.literal.object(
                  tsx.property.assignment(
                    "name",
                    tsx.literal.string(error.name),
                  ),
                  tsx.property.assignment(
                    "props",
                    tsx.literal.object(
                      tsx.property.assignment(
                        "message",
                        tsx.expression.propertyAccess("error", "message"),
                      ),
                      tsx.property.spreadAssignment(
                        tsx.expression.propertyAccess("parsedError", "result"),
                      ),
                    ),
                  ),
                  tsx.property.assignment(
                    "stack",
                    tsx.expression.propertyAccess("error", "stack"),
                  ),
                ),
              ),
            ),
          }),
        ),
        else: elseSt,
      })
    },
    fallbackSt,
  )

  return tsx.block(
    errorIfElseTree,
    tsx.statement.return(
      tsx.expression.call("defaultErrorMapper", {
        args: ["error"],
      }),
    ),
  )
}

function generateIfParseResultNotOkayEarlyReturn({
  parseResult,
  input,
}: {
  parseResult: string
  input: string | ts.Expression
}): ts.Statement {
  return tsx.statement.if({
    expression: tsx.expression.negate(
      tsx.expression.propertyAccess(parseResult, "ok"),
    ),
    then: tsx.statement.throw(
      tsx.expression.new("ParseError", {
        args: [
          tsx.expression.propertyAccess(parseResult, "errors"),
          typeof input === "string" ? tsx.expression.identifier(input) : input,
        ],
      }),
    ),
  })
}

function generateReturnOkay(): ts.Statement {
  return tsx.statement.return(
    tsx.expression.propertyAccess("outputParseResult", "result"),
  )
}
