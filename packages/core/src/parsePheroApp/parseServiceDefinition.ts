import ts from "typescript"
import { ParseError } from "../errors"
import extractErrors from "../extractErrors/extractErrors"
import parseModels from "./parseModels"
import getCreateServiceCallExpression from "./getCreateServiceCallExpression"
import { parseContext } from "./parseContext"
import parseFunctionDefinitions from "./parseFunctionDefinitions"
import { ParsedPheroServiceDefinition } from "./parsePheroApp"
import parseServiceConfig from "./parseServiceConfig"

export default function parseServiceDefinition(
  serviceExport: ts.VariableDeclaration | ts.ExportSpecifier,
  typeChecker: ts.TypeChecker,
): ParsedPheroServiceDefinition {
  const serviceName = serviceExport.name.getText()

  // check if the value of the export is a function call to "creatService"
  const createServiceCallExpr = getCreateServiceCallExpression(
    serviceExport,
    typeChecker,
  )

  if (!createServiceCallExpr) {
    throw new ParseError("S127: Cant find service export", serviceExport)
  }

  // parsing arguments of createService
  const [functionDefs, serviceConfig] = createServiceCallExpr.arguments
  const [parsedServiceConfig, functionDefinitions] = parseContext(
    parseServiceConfig(serviceConfig, typeChecker),
    parseFunctionDefinitions(functionDefs, typeChecker),
    typeChecker,
  )

  if (functionDefinitions.length === 0) {
    throw new ParseError("S128: Can't find function definitions", functionDefs)
  }

  return {
    name: serviceName,
    funcs: functionDefinitions,
    models: parseModels(functionDefinitions, typeChecker),
    errors: extractErrors(
      [
        ...functionDefinitions.map((f) => f.actualFunction),
        ...(parsedServiceConfig.middleware?.map((m) => m.middleware) ?? []),
      ],
      typeChecker,
    ),
    config: parsedServiceConfig,
  }
}
