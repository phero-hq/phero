import { tsx } from "@phero/core"
import {
  ParsedPheroFunctionDefinition,
  ParsedPheroServiceDefinition,
} from "@phero/core/dist/parsePheroApp"
import ts from "typescript"
import {
  write404ResponseStatement,
  writeResponseStatement,
} from "../generateExportHelpers"

export function generateServiceHandlerFile(
  service: ParsedPheroServiceDefinition,
): ts.Node[] {
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
            args: [tsx.expression.propertyAccess("req", "url")],
          }),
        }),
        handleService(service),
      ],
    }),
  ]
}

function serviceCorsConfig(service: ParsedPheroServiceDefinition): string {
  return `service_cors_config__${service.name}`
}

function functionExecutor(
  service: ParsedPheroServiceDefinition,
  func: ParsedPheroFunctionDefinition,
): string {
  return `rpc_executor_${service.name}__${func.name}`
}

function handleService(service: ParsedPheroServiceDefinition): ts.Statement {
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
      },
    ],
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
            tsx.expression.call(functionExecutor(service, func), {
              args: [
                tsx.expression.call(
                  tsx.expression.await(
                    tsx.expression.call("readBody", {
                      args: ["req"],
                    }),
                  ),
                ),
              ],
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
