import { PheroApp, tsx } from "@phero/core"
import ts from "typescript"

import {
  write404ResponseStatement,
  generateCreateAndStartServer,
} from "../generateExportHelpers"

const factory = ts.factory

export default function generateRootIndexFile(app: PheroApp): ts.Node[] {
  return [
    // import http
    tsx.importDeclaration({
      names: ["createServer"],
      module: "http",
    }),
    // import lib functions
    tsx.importDeclaration({
      names: ["writeResponse", "parseServiceAndFunction"],
      module: "./lib",
    }),
    // import services
    ...app.services.map((service) =>
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(
              false,
              tsx.expression.identifier("requestListener"),
              tsx.expression.identifier(`service__${service.name}`),
            ),
          ]),
        ),
        factory.createStringLiteral(`./${service.name}/handler`),
        undefined,
      ),
    ),
    generateRequestListener(app),
    generateCreateAndStartServer(),
  ]
}

function generateRequestListener(app: PheroApp): ts.Node {
  return tsx.function({
    name: "requestListener",
    async: true,
    returnType: tsx.type.reference({
      name: "Promise",
      args: [tsx.type.void],
    }),
    params: [
      tsx.param({ name: "req", type: tsx.type.any }),
      tsx.param({ name: "res", type: tsx.type.any }),
    ],
    body: [
      tsx.const({
        name: "requestedFunction",
        init: tsx.expression.call("parseServiceAndFunction", {
          args: ["req"],
        }),
      }),
      switchServices(app),
    ],
  })
}

function switchServices(app: PheroApp): ts.Statement {
  return tsx.statement.switch({
    expression: tsx.expression.propertyAccess(
      "requestedFunction",
      "serviceName",
    ),
    cases: app.services.map((service) => ({
      expression: service.name,
      statements: [
        tsx.statement.expression(
          tsx.expression.await(
            tsx.expression.call(`service__${service.name}`, {
              args: ["req", "res"],
            }),
          ),
        ),
        tsx.statement.return(),
      ],
    })),
    defaultCase: {
      statements: [
        tsx.const({ name: "originWhitelist", init: tsx.literal.undefined }),
        write404ResponseStatement(),
        tsx.statement.break,
      ],
    },
  })
}
