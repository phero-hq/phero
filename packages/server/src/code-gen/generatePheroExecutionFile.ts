import ts from "typescript"
import {
  PheroApp,
  PheroParseError,
  PheroFunction,
  PheroService,
  VirtualCompilerHost,
  tsx,
  PheroError,
  PheroServiceConfig,
  generateDependencyRefs,
  generateInlineParser,
  DependencyRefs,
  generateModelParser,
  cloneTS,
} from "@phero/core"
import { generateErrorParser } from "@phero/core/dist/generateParser"

const factory = ts.factory

export default function generatePheroExecutionFile(
  app: PheroApp,
  prog: ts.Program,
): { js: string } {
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
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports(
            serviceNames.map((serviceName) =>
              factory.createImportSpecifier(
                false,
                undefined,
                factory.createIdentifier(serviceName),
              ),
            ),
          ),
        ),
        // TODO cleanup
        factory.createStringLiteral(
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
    tsx.verbatim(`type Defer<T = void> = {
  resolve: (result: T) => void
  reject: (err: Error) => void
  promise: Promise<T>
}

function defer<T>(): Defer<T> {
  const deferred: Defer<T> = {} as Defer<T>
  const promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = (result: T) => resolve(result)
    deferred.reject = (err: Error) => reject(err)
  })
  deferred.promise = promise
  return deferred
}

class ContextParseError extends Error {
  constructor(public readonly errors: DataParseError[], public readonly input: any) {
    super("ContextParseError")
    // https://github.com/microsoft/TypeScript/issues/22585
    Object.setPrototypeOf(this, ContextParseError.prototype)
  }
}

function defaultErrorMapper<T>(error: unknown): RPCResult<T> {
  if (error instanceof ContextParseError) {
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
}
  `),
  )
  const depRefs = generateDependencyRefs(app.deps)

  for (const domainModel of app.models) {
    tsNodes.push(cloneTS(domainModel.ref))
  }
  for (const [name, model] of [...app.deps]) {
    // tsNodes.push(generateParserFunction(name, model,  depRefs))
    tsNodes.push(generateModelParser(name, model, depRefs))
  }
  for (const error of [...app.errors]) {
    tsNodes.push(generateErrorParser(error, depRefs))
  }

  const middlewareModelSet = new Set<ts.Node>()
  for (const middlewareModel of app.services.flatMap(
    (s) => s.config.models ?? [],
  )) {
    if (!middlewareModelSet.has(middlewareModel.ref)) {
      middlewareModelSet.add(middlewareModel.ref)
      // TODO!!!! tsNodes.push(generateModelParser(middlewareModel.ref, prog))
      throw new Error("TODO")
    }
  }

  for (const service of app.services) {
    tsNodes.push(generateCorsConfigFunction(service))

    if (service.config.middleware?.length) {
      tsNodes.push(
        generateMiddlewareParsers(service.name, service.config, prog),
      )
    }

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
    params: [tsx.param({ name: "input", type: tsx.type.any })],
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

function generateInnerFunction(
  service: PheroService,
  funcDef: PheroFunction,
  depRefs: DependencyRefs,
): ts.FunctionDeclaration {
  return tsx.function({
    name: `rpc_executor_${service.name}__${funcDef.name}__inner`,
    params: [
      tsx.param({
        name: "input",
        type: tsx.type.any,
      }),
    ],
    returnType: tsx.type.reference({
      name: "Promise",
      args: [tsx.type.any],
    }),
    body: tsx.block(
      tsx.const({
        name: "runner",
        init: tsx.arrowFunction({
          async: true,
          params: [
            tsx.param({
              name: "resolveEXEC",
              type: tsx.type.any,
            }),
            tsx.param({
              name: "rejectEXEC",
              type: tsx.type.any,
            }),
          ],
          body: tsx.block(
            tsx.const({
              name: "inputParser",
              init: generateInlineParser(funcDef.parametersModel, depRefs),
            }),

            tsx.const({
              name: "outputParser",
              init: generateInlineParser(funcDef.returnTypeModel, depRefs),
            }),

            ...(service.config.middleware
              ? [
                  tsx.const({
                    name: "resolvers",
                    init: tsx.literal.array(
                      // for middleware
                      ...service.config.middleware.map((middleware) =>
                        tsx.literal.object(
                          tsx.property.assignment(
                            "inputContext",
                            tsx.expression.call("defer", {
                              typeArgs: [
                                middleware.contextType ?? tsx.literal.type(),
                              ],
                            }),
                          ),
                          tsx.property.assignment(
                            "exec",
                            tsx.expression.call("defer"),
                          ),
                        ),
                      ),
                      // for the actual function
                      tsx.literal.object(
                        tsx.property.assignment(
                          "inputContext",
                          tsx.expression.call("defer", {
                            typeArgs: [
                              service.config.contextType ?? tsx.type.void,
                            ],
                          }),
                        ),
                        tsx.property.assignment(
                          "exec",
                          tsx.expression.call("defer"),
                        ),
                      ),
                    ),
                  }),

                  ...Array.from({
                    length: service.config.middleware.length + 1,
                  }).map((x, index) =>
                    tsx.statement.expression(
                      // resolvers[2].exec.promise.catch(rejectEXEC)
                      tsx.expression.call(
                        tsx.expression.propertyAccess(
                          tsx.expression.elementAccess("resolvers", index),
                          "exec",
                          "promise",
                          "catch",
                        ),
                        { args: ["rejectEXEC"] },
                      ),
                    ),
                  ),

                  tsx.const({
                    name: "middlewarePromises",
                    init: tsx.literal.array(),
                    type: tsx.type.array(
                      tsx.type.reference({
                        name: "Promise",
                        args: [tsx.type.void],
                      }),
                    ),
                  }),

                  tsx.statement.expression(
                    tsx.expression.call(
                      tsx.expression.propertyAccess(
                        tsx.expression.elementAccess("resolvers", 0),
                        "inputContext",
                        "resolve",
                      ),
                      {
                        args: [
                          tsx.expression.propertyAccess("input", "context"),
                        ],
                      },
                    ),
                  ),

                  // for loop
                  tsx.statement.simpleForOver({
                    name: tsx.expression.propertyAccess(
                      service.name,
                      "config",
                      "middleware",
                    ),
                    block: [
                      tsx.const({
                        name: "middleware",
                        init: tsx.expression.elementAccess(
                          tsx.expression.propertyAccess(
                            service.name,
                            "config",
                            "middleware",
                          ),
                          "i",
                        ),
                      }),
                      tsx.const({
                        name: "parseMiddlewareParams",
                        init: tsx.expression.elementAccess(
                          tsx.expression.elementAccess(
                            `service_middlewares_${service.name}`,
                            "i",
                          ),
                          0,
                        ),
                      }),
                      tsx.const({
                        name: "parseMiddlewareContext",
                        init: tsx.expression.elementAccess(
                          tsx.expression.elementAccess(
                            `service_middlewares_${service.name}`,
                            "i",
                          ),
                          1,
                        ),
                      }),
                      tsx.const({
                        name: "parseMiddlewareNextOut",
                        init: tsx.expression.elementAccess(
                          tsx.expression.elementAccess(
                            `service_middlewares_${service.name}`,
                            "i",
                          ),
                          2,
                        ),
                      }),
                      tsx.const({
                        name: "currResolverIndex",
                        init: tsx.expression.identifier("i"),
                      }),
                      tsx.const({
                        name: "nextResolverIndex",
                        init: tsx.expression.binary(
                          tsx.expression.identifier("i"),
                          "+",
                          tsx.literal.number(1),
                        ),
                      }),

                      // const ctx = await resolvers[currResolverIndex].inputContext.promise
                      tsx.const({
                        name: "ctx",
                        init: tsx.expression.await(
                          tsx.expression.propertyAccess(
                            tsx.expression.elementAccess(
                              "resolvers",
                              "currResolverIndex",
                            ),
                            "inputContext",
                            "promise",
                          ),
                        ),
                      }),

                      // const parsedContext = parseMiddlewareContext(i, ctx)
                      tsx.const({
                        name: "parsedContextParseResult",
                        init: tsx.expression.call("parseMiddlewareContext", {
                          args: ["ctx"],
                        }),
                      }),

                      generateIfParseResultNotOkayEarlyReturn({
                        parseResult: "parsedContextParseResult",
                        input: "ctx",
                      }),

                      tsx.const({
                        name: "parsedContext",
                        init: tsx.expression.propertyAccess(
                          "parsedContextParseResult",
                          "result",
                        ),
                      }),

                      // const parsedParams = parseMiddlewareParams(i, ctx)
                      tsx.const({
                        name: "parsedParamsParseResult",
                        init: tsx.expression.call("parseMiddlewareParams", {
                          args: ["input"],
                        }),
                      }),

                      generateIfParseResultNotOkayEarlyReturn({
                        parseResult: "parsedParamsParseResult",
                        input: "input",
                      }),

                      tsx.const({
                        name: "parsedParams",
                        init: tsx.expression.propertyAccess(
                          "parsedParamsParseResult",
                          "result",
                        ),
                      }),

                      tsx.const({
                        name: "middlewarePromise",
                        init: tsx.expression.call(
                          tsx.expression.propertyAccess(
                            tsx.expression.call(
                              tsx.expression.propertyAccess(
                                tsx.expression.call("middleware", {
                                  args: [
                                    "parsedParams",
                                    "parsedContext",
                                    tsx.arrowFunction({
                                      async: true,
                                      params: [
                                        tsx.param({
                                          name: "nextOutput",
                                          type: tsx.type.any,
                                        }),
                                      ],
                                      body: [
                                        // const parsedOut = parseMiddlewareNextOut(i, nextOutput)
                                        tsx.const({
                                          name: "parsedOutParseResult",
                                          init: tsx.expression.ternary(
                                            tsx.expression.binary(
                                              tsx.expression.identifier(
                                                "parseMiddlewareNextOut",
                                              ),
                                              "!=",
                                              tsx.literal.null,
                                            ),
                                            tsx.expression.call(
                                              "parseMiddlewareNextOut",
                                              { args: ["nextOutput"] },
                                            ),
                                            tsx.literal.object(
                                              tsx.property.assignment(
                                                "ok",
                                                tsx.literal.true,
                                              ),
                                              tsx.property.assignment(
                                                "result",
                                                tsx.literal.object(),
                                              ),
                                            ),
                                          ),
                                        }),

                                        // generateIfParseResultNotOkayEarlyReturn({
                                        //   parseResult: "parsedOutParseResult",
                                        // }),

                                        tsx.statement.if({
                                          expression: tsx.expression.binary(
                                            tsx.expression.propertyAccess(
                                              "parsedOutParseResult",
                                              "ok",
                                            ),
                                            "===",
                                            tsx.literal.false,
                                          ),
                                          then: tsx.block(
                                            tsx.statement.expression(
                                              tsx.expression.call(
                                                tsx.expression.propertyAccess(
                                                  tsx.expression.elementAccess(
                                                    "resolvers",
                                                    "nextResolverIndex",
                                                  ),
                                                  "inputContext",
                                                  "reject",
                                                ),
                                                {
                                                  args: [
                                                    tsx.expression.new(
                                                      "ContextParseError",
                                                      {
                                                        args: [
                                                          tsx.expression.propertyAccess(
                                                            "parsedOutParseResult",
                                                            "errors",
                                                          ),
                                                        ],
                                                      },
                                                    ),
                                                  ],
                                                },
                                              ),
                                            ),
                                            tsx.statement.return(),
                                          ),
                                        }),

                                        tsx.const({
                                          name: "parsedOut",
                                          init: tsx.expression.propertyAccess(
                                            "parsedOutParseResult",
                                            "result",
                                          ),
                                        }),

                                        // resolvers[nextResolverIndex].inputContext.resolve(
                                        //   {
                                        //     ...ctx,
                                        //     ...parsedOut,
                                        //   },
                                        // ),
                                        tsx.statement.expression(
                                          tsx.expression.call(
                                            tsx.expression.propertyAccess(
                                              tsx.expression.elementAccess(
                                                "resolvers",
                                                "nextResolverIndex",
                                              ),
                                              "inputContext",
                                              "resolve",
                                            ),
                                            {
                                              args: [
                                                tsx.literal.object(
                                                  tsx.property.spreadAssignment(
                                                    "ctx",
                                                  ),
                                                  tsx.property.spreadAssignment(
                                                    "parsedOut",
                                                  ),
                                                ),
                                              ],
                                            },
                                          ),
                                        ),

                                        // await resolvers[nextResolverIndex].exec.promise
                                        tsx.statement.expression(
                                          tsx.expression.await(
                                            tsx.expression.propertyAccess(
                                              tsx.expression.elementAccess(
                                                "resolvers",
                                                "nextResolverIndex",
                                              ),
                                              "exec",
                                              "promise",
                                            ),
                                          ),
                                        ),
                                      ],
                                    }),
                                  ],
                                }),
                                "then",
                              ),
                              {
                                args: [
                                  tsx.arrowFunction({
                                    params: [],
                                    body: [
                                      // resolvers[currResolverIndex].exec.resolve()
                                      tsx.statement.expression(
                                        tsx.expression.call(
                                          tsx.expression.propertyAccess(
                                            tsx.expression.elementAccess(
                                              "resolvers",
                                              "currResolverIndex",
                                            ),
                                            "exec",
                                            "resolve",
                                          ),
                                        ),
                                      ),
                                    ],
                                  }),
                                ],
                              },
                            ),
                            "catch",
                          ),
                          {
                            args: [
                              tsx.arrowFunction({
                                params: [
                                  tsx.param({
                                    name: "err",
                                    type: tsx.type.reference({
                                      name: "Error",
                                    }),
                                  }),
                                ],
                                body: [
                                  // resolvers[currResolverIndex].exec.reject(err)
                                  tsx.statement.expression(
                                    tsx.expression.call(
                                      tsx.expression.propertyAccess(
                                        tsx.expression.elementAccess(
                                          "resolvers",
                                          "currResolverIndex",
                                        ),
                                        "exec",
                                        "reject",
                                      ),
                                      {
                                        args: ["err"],
                                      },
                                    ),
                                  ),
                                ],
                              }),
                            ],
                          },
                        ),
                      }),
                      tsx.statement.expression(
                        tsx.expression.call(
                          tsx.expression.propertyAccess(
                            "middlewarePromises",
                            "push",
                          ),
                          {
                            args: ["middlewarePromise"],
                          },
                        ),
                      ),
                    ],
                  }),

                  tsx.const({
                    name: "middlewareOutput",
                    init: tsx.expression.await(
                      tsx.expression.propertyAccess(
                        tsx.expression.elementAccess(
                          "resolvers",
                          service.config.middleware.length,
                        ),
                        "inputContext",
                        "promise",
                      ),
                    ),
                  }),

                  tsx.const({
                    name: "inputWithContext",
                    init: tsx.literal.object(
                      ...(funcDef.contextParameterType
                        ? [
                            tsx.property.spreadAssignment("input"),
                            tsx.property.assignment(
                              "context",
                              tsx.expression.identifier("middlewareOutput"),
                            ),
                          ]
                        : [tsx.property.spreadAssignment("input")]),
                    ),
                  }),

                  tsx.const({
                    name: "inputParseResult",
                    init: tsx.expression.call("inputParser", {
                      args: ["inputWithContext"],
                    }),
                  }),
                ]
              : [
                  tsx.const({
                    name: "inputParseResult",
                    init: tsx.expression.call("inputParser", {
                      args: ["input"],
                    }),
                  }),
                ]),

            generateIfParseResultNotOkayEarlyReturn({
              parseResult: "inputParseResult",
              input: "input",
            }),

            generateRPCFunctionCall({ service, funcDef }),
          ),
        }),
      }),
      tsx.statement.return(
        tsx.expression.new("Promise", {
          args: [
            tsx.arrowFunction({
              params: [
                tsx.param({ name: "resolve", type: tsx.type.any }),
                tsx.param({ name: "reject", type: tsx.type.any }),
              ],
              body: [
                tsx.statement.expression(
                  tsx.expression.call(
                    tsx.expression.propertyAccess(
                      tsx.expression.call(
                        tsx.expression.propertyAccess(
                          tsx.expression.call("runner", {
                            args: ["resolve", "reject"],
                          }),
                          "then",
                        ),
                        { args: ["resolve"] },
                      ),
                      "catch",
                    ),
                    { args: ["reject"] },
                  ),
                ),
              ],
            }),
          ],
        }),
      ),
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

function generateRPCFunctionCall({
  service,
  funcDef,
}: {
  service: PheroService
  funcDef: PheroFunction
}): ts.Block {
  return tsx.block(
    tsx.const({
      name: "output",
      init: tsx.expression.await(
        tsx.expression.call(
          tsx.expression.propertyAccess(
            service.name,
            "functions",
            funcDef.name,
          ),
          {
            args: [
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
    }),

    ...(service.config.middleware?.length
      ? [
          // resolvers[3].exec.resolve()
          tsx.statement.expression(
            tsx.expression.call(
              tsx.expression.propertyAccess(
                tsx.expression.elementAccess(
                  "resolvers",
                  service.config.middleware.length,
                ),
                "exec",
                "resolve",
              ),
            ),
          ),
          // await Promise.all(middlewarePromises);
          tsx.statement.expression(
            tsx.expression.await(
              tsx.expression.call(
                tsx.expression.propertyAccess("Promise", "all"),
                { args: ["middlewarePromises"] },
              ),
            ),
          ),
        ]
      : []),

    tsx.const({
      name: "outputParseResult",
      init: tsx.expression.call("outputParser", { args: ["output"] }),
    }),

    generateIfParseResultNotOkayEarlyReturn({
      parseResult: "outputParseResult",
      input: "output",
    }),

    generateReturnOkay(),
  )
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
      tsx.expression.identifier("ContextParseError"),
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
  input: string
}): ts.Statement {
  return tsx.statement.if({
    expression: tsx.expression.binary(
      tsx.expression.propertyAccess(parseResult, "ok"),
      "===",
      tsx.literal.false,
    ),
    then: tsx.statement.block(
      tsx.statement.expression(
        tsx.expression.call("rejectEXEC", {
          args: [
            tsx.expression.new("ContextParseError", {
              args: [
                tsx.expression.propertyAccess(parseResult, "errors"),
                tsx.expression.identifier(input),
              ],
            }),
          ],
        }),
      ),
      tsx.statement.return(),
    ),
  })
}

function generateReturnOkay(): ts.Statement {
  return tsx.statement.expression(
    tsx.expression.call("resolveEXEC", {
      args: [tsx.expression.propertyAccess("outputParseResult", "result")],
    }),
  )
}

function getParameterName(name: ts.BindingName): string {
  if (ts.isIdentifier(name)) {
    return name.text
  } else if (ts.isBindingName(name)) {
    throw new PheroParseError(
      `S138: No support for binding names ${name?.kind}`,
      name,
    )
  }

  throw new PheroParseError("S139: Name not supported", name)
}

function generateMiddlewareParsers(
  serviceName: string,
  serviceConfig: PheroServiceConfig,
  prog: ts.Program,
): ts.VariableStatement {
  const middlewares = serviceConfig.middleware ?? []
  return tsx.const({
    name: `service_middlewares_${serviceName}`,
    init: tsx.literal
      .array
      // TODO!!!
      // ...middlewares.map((middleware) =>
      //   tsx.literal.array(
      //     generateInlineParser(tsx.type.any, middleware.paramsType, prog),

      //     generateInlineParser(tsx.type.any, middleware.contextType, prog),

      //     middleware.nextType
      //       ? generateInlineParser(tsx.type.any, middleware.nextType, prog)
      //       : tsx.literal.null,
      //   ),
      // ),
      (),
  })
}
