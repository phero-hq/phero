import ts from "typescript"
import * as tsx from "./tsx"
import { ParsedPheroApp, ParsedPheroServiceDefinition } from "./parsePheroApp"
import { VirtualCompilerHost } from "./VirtualCompilerHost"

const factory = ts.factory

export default function generateProductionServer(
  app: ParsedPheroApp,
  typeChecker: ts.TypeChecker,
): { js: string } {
  const tsNodes: ts.Node[] = []

  tsNodes.push(
    // import http
    factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(
            false,
            undefined,
            factory.createIdentifier("createServer"),
          ),
        ]),
      ),
      factory.createStringLiteral("http"),
      undefined,
    ),
    // import rpc's from phero-execution.js
    factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports(
          app.services.flatMap((service) => [
            factory.createImportSpecifier(
              false,
              undefined,
              generateIdentifierForServiceCorsConfig(service.name),
            ),
            ...service.funcs.map((func) =>
              factory.createImportSpecifier(
                false,
                undefined,
                generateIdentifierForRPCFunction(service.name, func.name),
              ),
            ),
          ]),
        ),
      ),
      factory.createStringLiteral("./phero-execution"),
      undefined,
    ),
  )

  tsNodes.push(generateRequestListener(app))
  tsNodes.push(generateCreateAndStartServer(), generateHelperFunctions())

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const file = ts.createSourceFile(
    "phero-production-server.ts",
    "",
    ts.ScriptTarget.ES5,
    false,
    ts.ScriptKind.TS,
  )

  const tsPheroExecution = printer.printList(
    ts.ListFormat.SourceFileStatements,
    ts.factory.createNodeArray(tsNodes),
    file,
  )

  const vHost = new VirtualCompilerHost({
    declaration: false,
  })
  vHost.addFile("phero-production-server.ts", tsPheroExecution)

  const prog = vHost.createProgram("phero-production-server.ts")

  prog.emit()

  const js = vHost.getFile("phero-production-server.js")

  if (!js) {
    throw new Error("Some error in generated TS.")
  }

  return { js }
}

function generateIdentifierForRPCFunction(
  serviceName: string,
  funcName: string,
): ts.Identifier {
  return factory.createIdentifier(`rpc_executor_${serviceName}__${funcName}`)
}

function generateIdentifierForServiceCorsConfig(
  serviceName: string,
): ts.Identifier {
  return factory.createIdentifier(`service_cors_config__${serviceName}`)
}

function generateCreateAndStartServer(): ts.Node {
  return tsx.verbatim(`
      const PORT = process.env.PORT ?? 2222

      createServer(requestListener)
        .listen(PORT)
        .on("listening", () =>
          console.info(\`Phero started listening on port \${PORT}\`),
        )
    `)
}

function generateHelperFunctions(): ts.Node {
  return tsx.verbatim(`
    function parseServiceAndFunction(url) {
      const { pathname } = new URL(\`http://host\${url}\`)
      const sanitizedPathname = pathname.endsWith("/")
        ? pathname.slice(0, pathname.length - 1)
        : pathname

      const [serviceName, functionName] = sanitizedPathname.split('/').slice(1);
      return { serviceName, functionName };
    }

    function readBody(request) {
      return new Promise((resolve, reject) => {
        const chunks = []
        request
          .on("data", (chunk) => {
            chunks.push(chunk)
          })
          .on("end", () => {
            resolve(Buffer.concat(chunks).toString())
          })
          .on("error", (err) => {
            reject(err)
          })
      })
    }

    async function writeResponse(originWhitelist, responseOrLazyResponse, res, req) {
      res.setHeader("Content-Type", "application/json")

      if (originWhitelist && originWhitelist.length > 0 && req.headers.origin !== undefined) {
        const isValidOrigin = originWhitelist.includes(req.headers.origin)
        
        if (!isValidOrigin) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: "Invalid origin. Maybe you forgot to add cors config to your service?" }));
          return
        }
        
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin)
        res.setHeader("Vary", "origin")
        res.setHeader("Access-Control-Allow-Methods", "POST")
        res.setHeader("Access-Control-Allow-Headers", "content-type")
      }

      const response = typeof responseOrLazyResponse === "function" 
        ? responseOrLazyResponse()
        : responseOrLazyResponse

      res.statusCode = response.status
      
      switch (response.status) {
        case 200:
          res.end(JSON.stringify(response.result))
          break
        case 400:
          res.end(JSON.stringify({ errors: response.errors }))
          break
        case 401:
          res.end(JSON.stringify({ error: response.error }))
          break
        case 404:
          res.end(JSON.stringify({ error: response.error }))
          break
        case 500:
          res.end(JSON.stringify({ error: response.error }))
          break
        default:
          res.end(JSON.stringify({ error: "Unsupported status" }))
          break
      }
    }
  `)
}

function writeResponseStatement(expression: ts.Expression): ts.Statement {
  return tsx.statement.expression(
    tsx.expression.call("writeResponse", {
      args: ["originWhitelist", expression, "res", "req"],
    }),
  )
}

function write404ResponseStatement(): ts.Statement {
  return writeResponseStatement(
    tsx.literal.object(
      tsx.property.assignment("status", tsx.literal.number(404)),
      tsx.property.assignment("error", tsx.literal.string("RPC Not Found")),
    ),
  )
}

function generateRequestListener(app: ParsedPheroApp): ts.Node {
  return tsx.function({
    name: "requestListener",
    params: [
      tsx.param({ name: "req", type: tsx.type.any }),
      tsx.param({ name: "res", type: tsx.type.any }),
    ],
    async: true,
    returnType: tsx.type.void,
    body: [
      tsx.const({
        name: "requestedFunction",
        init: tsx.expression.call("parseServiceAndFunction", {
          args: [tsx.expression.propertyAccess("req", "url")],
        }),
      }),
      switchServices(app),
    ],
  })
}

function switchServices(app: ParsedPheroApp): ts.Statement {
  return tsx.statement.switch({
    expression: tsx.expression.propertyAccess(
      "requestedFunction",
      "serviceName",
    ),
    cases: app.services.map((service) => ({
      expression: service.name,
      statements: [
        tsx.const({
          name: "serviceCorsConfig",
          init: tsx.expression.await(
            tsx.expression.call(
              generateIdentifierForServiceCorsConfig(service.name),
            ),
          ),
        }),
        tsx.const({
          name: "originWhitelist",
          init: tsx.expression.ternary(
            tsx.expression.identifier("serviceCorsConfig"),
            tsx.expression.propertyAccess(
              "serviceCorsConfig",
              "originWhitelist",
            ),
            tsx.literal.undefined,
          ),
        }),
        switchHttpMethods(service),
        tsx.statement.return(),
      ],
    })),
    defaultCase: {
      statements: [write404ResponseStatement(), tsx.statement.break],
    },
  })
}

function switchHttpMethods(
  service: ParsedPheroServiceDefinition,
): ts.Statement {
  return tsx.statement.switch({
    expression: tsx.expression.propertyAccess("req", "method"),
    cases: [
      {
        expression: "OPTIONS",
        statements: [
          writeResponseStatement(
            tsx.literal.object(
              tsx.property.assignment("status", tsx.literal.number(200)),
              tsx.property.assignment("result", tsx.literal.string("")),
            ),
          ),
          tsx.statement.break,
        ],
      },
      {
        expression: "POST",
        statements: [switchService(service), tsx.statement.break],
      },
    ],
    defaultCase: {
      statements: [write404ResponseStatement(), tsx.statement.break],
    },
  })
}

function switchService(service: ParsedPheroServiceDefinition): ts.Statement {
  return tsx.statement.switch({
    expression: tsx.expression.propertyAccess(
      "requestedFunction",
      "functionName",
    ),
    cases: service.funcs.map((func) => ({
      expression: func.name,
      statements: [
        writeResponseStatement(
          tsx.expression.await(
            tsx.expression.call(
              generateIdentifierForRPCFunction(service.name, func.name),
              {
                args: [
                  tsx.expression.call(
                    tsx.expression.propertyAccess("JSON", "parse"),
                    {
                      args: [
                        tsx.expression.await(
                          tsx.expression.call("readBody", {
                            args: ["req"],
                          }),
                        ),
                      ],
                    },
                  ),
                ],
              },
            ),
          ),
        ),
        tsx.statement.break,
      ],
    })),
    defaultCase: {
      statements: [write404ResponseStatement(), tsx.statement.break],
    },
  })
}
