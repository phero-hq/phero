import ts from "typescript"
import * as tsx from "./tsx"
import { ParsedSamenApp } from "./parseSamenApp"
import { VirtualCompilerHost } from "./VirtualCompilerHost"

const factory = ts.factory

export default function generateProductionServer(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
): { js: string } {
  const tsNodes: ts.Node[] = []

  tsNodes.push(
    // import http
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
            factory.createIdentifier("createServer"),
          ),
        ]),
      ),
      factory.createStringLiteral("http"),
      undefined,
    ),
    // import rpc's from samen-execution.js
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports(
          app.services.flatMap((service) =>
            service.funcs.map((func) =>
              factory.createImportSpecifier(
                false,
                undefined,
                generateIdentifierForRPCFunction(service.name, func.name),
              ),
            ),
          ),
        ),
      ),
      factory.createStringLiteral("./samen-execution"),
      undefined,
    ),
  )

  tsNodes.push(generateRequestListener(app))
  tsNodes.push(generateCreateAndStartServer(), generateHelperFucntions())

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const file = ts.createSourceFile(
    "samen-production-server.ts",
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
  vHost.addFile("samen-production-server.ts", tsSamenExecution)

  const prog = vHost.createProgram("samen-production-server.ts")

  prog.emit()

  console.log(vHost.getFile("samen-production-server.ts"))

  const js = vHost.getFile("samen-production-server.js")

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

function generateCreateAndStartServer(): ts.Node {
  return tsx.verbatim(`
      const PORT = process.env.PORT ?? 2222

      createServer(requestListener)
        .listen(PORT)
        .on("listening", () =>
          console.info(\`Samen started listening on port \${PORT}\`),
        )
    `)
}

function generateHelperFucntions(): ts.Node {
  return tsx.verbatim(`
    function parsePathName(url) {
      const { pathname } = new URL(\`http://host\${url}\`)
      return pathname.endsWith("/")
        ? pathname.slice(0, pathname.length - 1)
        : pathname
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

    function writeResponse(response, res) {
      res.writeHead(response.status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      })
      switch (response.status) {
        case 200:
          res.end(JSON.stringify(response.result))
          break
        case 400:
          res.end(JSON.stringify({ errors: response.errors }))
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

function generateRequestListener(app: ParsedSamenApp): ts.Node {
  const writeResponseStatement = (expression: ts.Expression) => {
    return tsx.statement.expression(
      tsx.expression.call("writeResponse", {
        args: [expression, "res"],
      }),
    )
  }

  const generateDefaultCase = () => ({
    statements: [
      writeResponseStatement(
        tsx.literal.object(
          tsx.property.assignment("status", tsx.literal.number(404)),
          tsx.property.assignment("error", tsx.literal.string("RPC Not Found")),
        ),
      ),
      tsx.statement.break,
    ],
  })

  return tsx.function({
    name: "requestListener",
    params: [
      tsx.param({ name: "req", type: tsx.type.any }),
      tsx.param({ name: "res", type: tsx.type.any }),
    ],
    async: true,
    returnType: tsx.type.void,
    body: [
      tsx.statement.switch({
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
            statements: [
              tsx.statement.switch({
                expression: tsx.expression.call("parsePathName", {
                  args: [tsx.expression.propertyAccess("req", "url")],
                }),
                cases: app.services.flatMap((service) =>
                  service.funcs.map((func) => ({
                    expression: `/${service.name}/${func.name}`,
                    statements: [
                      writeResponseStatement(
                        tsx.expression.await(
                          tsx.expression.call(
                            generateIdentifierForRPCFunction(
                              service.name,
                              func.name,
                            ),
                            {
                              args: [
                                tsx.expression.call(
                                  tsx.expression.propertyAccess(
                                    "JSON",
                                    "parse",
                                  ),
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
                ),
              }),
              tsx.statement.break,
            ],
          },
        ],
        defaultCase: generateDefaultCase(),
      }),
    ],
  })
}