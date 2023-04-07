import { tsx } from "@phero/core"
import { PheroFunction, PheroService } from "@phero/core"
import ts from "typescript"
import {
  write404ResponseStatement,
  writeResponseStatement,
} from "../generateExportHelpers"

export function generateServiceHandlerFile(service: PheroService): ts.Node[] {
  return [
    tsx.importDeclaration({
      names: ["writeResponse", "parseServiceAndFunction", "readBody"],
      module: "./lib",
    }),
    tsx.importDeclaration({
      names: [
        serviceCorsConfig(service),
        ...service.funcs.map((func) => functionExecutor(service, func)),
      ],
      module: "./phero-execution",
    }),
    tsx.function({
      name: "requestListener",
      export: true,
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
        handleService(service),
      ],
    }),
  ]
}

function serviceCorsConfig(service: PheroService): string {
  return `service_cors_config__${service.name}`
}

function functionExecutor(service: PheroService, func: PheroFunction): string {
  return `rpc_executor_${service.name}__${func.name}`
}

function handleService(service: PheroService): ts.Statement {
  return tsx.statement.switch({
    expression: tsx.expression.propertyAccess(
      "requestedFunction",
      "serviceName",
    ),
    cases: [
      {
        expression: service.name,
        statements: [
          tsx.const({
            name: "serviceCorsConfig",
            init: tsx.expression.await(
              tsx.expression.call(serviceCorsConfig(service)),
            ),
          }),
          tsx.const({
            name: "originWhitelist",
            init: tsx.expression.ternary(
              tsx.expression.identifier("serviceCorsConfig"),
              tsx.expression.identifier("serviceCorsConfig"),
              tsx.literal.undefined,
            ),
          }),
          switchHttpMethods(service),
          tsx.statement.return(),
        ],
      },
    ],
    defaultCase: {
      statements: [write404ResponseStatement(), tsx.statement.break],
    },
  })
}

function switchHttpMethods(service: PheroService): ts.Statement {
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

function switchService(service: PheroService): ts.Statement {
  return tsx.statement.switch({
    expression: tsx.expression.propertyAccess(
      "requestedFunction",
      "functionName",
    ),
    cases: service.funcs.map((func) => ({
      expression: func.name,
      statements: [
        tsx.const({
          name: `${func.name}Data`,
          init: tsx.expression.await(
            tsx.expression.call("readBody", {
              args: ["req"],
            }),
          ),
        }),
        writeResponseStatement(
          tsx.expression.await(
            tsx.expression.call(functionExecutor(service, func), {
              args: [`${func.name}Data`],
            }),
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
