import ts from "typescript"
import { ParsedSamenApp } from ".."
import { getReturnType } from "../extractFunctionFromServiceProperty"
import {
  ParsedSamenFunctionDefinition,
  ParsedSamenServiceConfig,
  ParsedSamenServiceDefinition,
} from "../parseSamenApp"
import { printCode } from "../tsTestUtils"
import { VirtualCompilerHost } from "../VirtualCompilerHost"
import generateModelParser, {
  generateParserBody,
} from "./parsers/generateParser"
import generateParserFromModel from "./parsers/generateParserFromModel"
import generateParserModel from "./parsers/generateParserModel"

import * as tsx from "../tsx"
import { generateMiddlewareParsers } from "../generatedMiddlewareRunner"
import { ParsedError } from "../extractErrors/parseThrowStatement"

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

  tsNodes.push(
    tsx.verbatim(`
    type Defer<T = void> = {
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
      constructor(public readonly errors: ValidationError[]) {
        super("ContextParseError")
      }
    }
  `),
  )

  for (const domainModel of app.models) {
    tsNodes.push(domainModel)
    tsNodes.push(generateModelParser(domainModel, typeChecker))
  }

  for (const service of app.services) {
    if (service.config.middleware?.length) {
      tsNodes.push(
        generateMiddlewareParsers(service.name, service.config, typeChecker),
      )
    }

    for (const serviceModel of service.models) {
      tsNodes.push(serviceModel, generateModelParser(serviceModel, typeChecker))
    }

    for (const serviceFunction of service.funcs) {
      tsNodes.push(
        generateRPCExecutor(service, serviceFunction, app.errors, typeChecker),
        generateInnerFunction(service, serviceFunction, typeChecker),
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

  // console.log(vHost.getFile("samen-execution.ts"))

  const js = vHost.getFile("samen-execution.js")

  if (!js) {
    throw new Error("Some error in generated TS.")
  }

  return { js }
}

function generateRPCExecutor(
  service: ParsedSamenServiceDefinition,
  funcDef: ParsedSamenFunctionDefinition,
  domainErrors: ParsedError[],
  typeChecker: ts.TypeChecker,
): ts.FunctionDeclaration {
  return tsx.function({
    export: true,
    async: true,
    name: `rpc_executor_${service.name}__${funcDef.name}`,
    params: [tsx.param({ name: "input", type: tsx.type.any })],
    returnType: tsx.type.reference({
      name: "Promise",
      args: [tsx.type.reference({ name: "RPCResult", args: [tsx.type.any] })],
    }),
    body: tsx.block(
      wrapWithErrorHandler(
        service,
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
  service: ParsedSamenServiceDefinition,
  funcDef: ParsedSamenFunctionDefinition,
  typeChecker: ts.TypeChecker,
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
              init: generateInlineParser({
                returnType: tsx.type.any,
                parser: generateParserFromModel(
                  generateParserModel(
                    typeChecker,
                    funcDef.actualFunction,
                    "data",
                  ),
                ),
              }),
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

            ...(service.config.middleware
              ? [
                  tsx.const({ name: "v4", init: tsx.literal.true }),

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
                          tsx.expression.propertyAccess(
                            "input",
                            funcDef.serviceContext?.paramName ?? "context",
                          ),
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
                                  tsx.verbatim("console.log(`huhhhhh`);"),
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
                      ...(!!funcDef.serviceContext?.paramName
                        ? [
                            tsx.property.spreadAssignment("input"),
                            tsx.property.assignment(
                              funcDef.serviceContext.paramName,
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
                  tsx.const({ name: "v3", init: tsx.literal.true }),

                  tsx.const({
                    name: "inputParseResult",
                    init: tsx.expression.call("inputParser", {
                      args: ["input"],
                    }),
                  }),
                ]),

            generateIfParseResultNotOkayEarlyReturn({
              parseResult: "inputParseResult",
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
  service: ParsedSamenServiceDefinition,
  domainErrors: ParsedError[],
  ...statements: ts.Statement[]
): ts.TryStatement {
  return tsx.statement.try({
    block: statements,
    catch: {
      error: "error",
      block: [
        tsx.verbatim(`console.log("errorerrorerror", error)`),
        tsx.verbatim(`console.log("errorname", error.constructor.name)`),
        tsx.verbatim(`console.log("iserror", error instanceof Error)`),
        generateErrorParsingFunction(
          service.name,
          domainErrors,
          service.errors,
        ),
      ],
    },
  })
}

export function generateInlineParser({
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
  service,
  funcDef,
}: {
  service: ParsedSamenServiceDefinition
  funcDef: ParsedSamenFunctionDefinition
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
            "func",
          ),
          {
            args: [
              ...funcDef.parameters.map((param) =>
                tsx.expression.propertyAccess(
                  "inputParseResult",
                  "result",
                  getParameterName(param.name),
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
          tsx.verbatim("console.log(`hallo??`)"),
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
    }),

    generateReturnOkay(),
  )
}

function generateErrorParsingFunction(
  serviceName: string,
  domainErrors: ParsedError[],
  serviceErrors: ParsedError[],
): ts.IfStatement {
  function wrapErrorWithStatusObject(
    errorObj: ts.ObjectLiteralExpression,
  ): ts.ObjectLiteralExpression {
    return tsx.literal.object(
      tsx.property.assignment("status", tsx.literal.number(500)),
      tsx.property.assignment("error", errorObj),
    )
  }

  const fallbackSt = tsx.statement.if({
    expression: tsx.expression.binary(
      tsx.expression.identifier("error"),
      "instanceof",
      tsx.expression.identifier("ContextParseError"),
    ),
    then: tsx.statement.return(
      tsx.literal.object(
        tsx.property.assignment("status", tsx.literal.number(400)),
        tsx.property.assignment(
          "errors",
          tsx.expression.propertyAccess("error", "errors"),
        ),
      ),
    ),
    else: tsx.statement.if({
      expression: tsx.expression.propertyAccess(
        tsx.expression.identifier("error?"),
        "message",
      ),
      then: tsx.statement.return(
        wrapErrorWithStatusObject(
          tsx.literal.object(
            tsx.property.assignment("name", tsx.literal.string("Error")),
            tsx.property.assignment(
              "props",
              tsx.literal.object(
                tsx.property.assignment(
                  "message",
                  tsx.expression.propertyAccess("error", "message"),
                ),
              ),
            ),
          ),
        ),
      ),
      else: tsx.statement.return(
        wrapErrorWithStatusObject(
          tsx.literal.object(
            tsx.property.assignment("name", tsx.literal.string("Error")),
            tsx.property.assignment(
              "props",
              tsx.literal.object(
                tsx.property.assignment(
                  "message",
                  tsx.literal.string("Internal Server Error"),
                ),
              ),
            ),
          ),
        ),
      ),
    }),
  })

  const errors: Array<{ clientName: ts.StringLiteral; error: ParsedError }> = [
    ...domainErrors.map((error) => ({
      clientName: tsx.literal.string(error.name),
      error,
    })),
    ...serviceErrors.map((error) => ({
      clientName: tsx.literal.string(`${serviceName}.${error.name}`),
      error,
    })),
  ]

  return errors.reduceRight((elseSt, { clientName, error }) => {
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
      then: tsx.statement.return(
        wrapErrorWithStatusObject(
          tsx.literal.object(
            tsx.property.assignment("name", clientName),
            tsx.property.assignment(
              "props",

              tsx.literal.object(
                ...error.properties.map((prop) =>
                  tsx.property.assignment(
                    prop.name,
                    tsx.expression.propertyAccess("error", prop.name),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      else: elseSt,
    })
  }, fallbackSt)
}

function generateIfParseResultNotOkayEarlyReturn({
  parseResult,
}: {
  parseResult: string
}) {
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
              args: [tsx.expression.propertyAccess(parseResult, "errors")],
            }),
          ],
        }),
      ),
      tsx.statement.return(),
    ),
  })
}

function generateReturnOkay() {
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
    throw new Error(`No support for binding names ${printCode(name)}`)
  }

  throw new Error("Name not supported")
}

const types = [
  tsx.typeAlias({
    name: "ParseResult",
    typeParameters: [tsx.typeParam({ name: "T" })],
    type: tsx.type.union(
      tsx.type.reference({
        name: "ParseResultSuccess",
        args: [tsx.type.reference({ name: "T" })],
      }),
      tsx.type.reference({ name: "ParseResultFailure" }),
    ),
  }),

  tsx.interface({
    name: "ParseResultSuccess",
    typeParameters: [tsx.typeParam({ name: "T" })],
    members: [
      tsx.property.signature("ok", tsx.type.literalType(tsx.literal.true)),

      tsx.property.signature("result", tsx.type.reference({ name: "T" })),
    ],
  }),

  tsx.interface({
    name: "ParseResultFailure",
    members: [
      tsx.property.signature("ok", tsx.type.literalType(tsx.literal.false)),

      tsx.property.signature(
        "errors",
        tsx.type.array(tsx.type.reference({ name: "ValidationError" })),
      ),
    ],
  }),
  tsx.interface({
    name: "ValidationError",
    members: [
      tsx.property.signature("path", tsx.type.string),
      tsx.property.signature("message", tsx.type.string),
    ],
  }),

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
        factory.createTypeReferenceNode(factory.createIdentifier("Record"), [
          factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        ]),
      ),
    ],
  ),
]
