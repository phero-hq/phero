import ts from "typescript"
import { ParseError } from "./errors"
import extractFunctionFromServiceProperty from "./extractFunctionFromServiceProperty"
import getLibFunctionCall from "./getLibFunctionCall"
import parseFunctionConfig, {
  mergeFunctionConfigs,
} from "./parseFunctionConfig"
import {
  ParsedSamenFunctionConfig,
  ParsedSamenFunctionDefinition,
  ParsedSamenServiceDefinition,
  SamenLibFunctions,
} from "./parseSamenApp"
import { getFirstChildOfKind, hasModifier, resolveSymbol } from "./tsUtils"

export default function extractServiceFromSamenExport(
  serviceExport: ts.VariableDeclaration | ts.ExportSpecifier,
  typeChecker: ts.TypeChecker,
): ParsedSamenServiceDefinition {
  const serviceName = serviceExport.name.getText()

  // check if the value of the export is a function call to "creatService"
  const createServiceCallExpr = getLibFunctionCall(
    serviceExport,
    typeChecker,
    SamenLibFunctions.CreateService,
  )

  if (!createServiceCallExpr) {
    throw new ParseError("Cant find service export", serviceExport)
  }

  // parsing arguments of createService
  const [functionDefs, serviceConfig] = createServiceCallExpr.arguments
  const parsedServiceConfig = parseFunctionConfig(serviceConfig, typeChecker)
  const functionDefinitions = parseFunctionDefinitions(
    functionDefs,
    typeChecker,
  )?.map((func) => ({
    ...func,
    config: mergeFunctionConfigs(parsedServiceConfig, func.config),
  }))

  if (!functionDefinitions || functionDefinitions.length === 0) {
    throw new ParseError("Can't find function definitions", functionDefs)
  }

  return {
    name: serviceName,
    funcs: functionDefinitions,
  }
}

function parseFunctionDefinitions(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionDefinition[] | undefined {
  if (!node) {
    return
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result: ParsedSamenFunctionDefinition[] = []
    const propertyAssignments = node.properties
    for (const propertyAssignment of propertyAssignments) {
      const func = extractFunctionFromServiceProperty(
        propertyAssignment,
        typeChecker,
      )
      result.push(func)
    }
    return result
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return parseFunctionDefinitions(symbol.valueDeclaration, typeChecker)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseFunctionDefinitions(node.initializer, typeChecker)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return parseFunctionDefinitions(node.getLastToken(), typeChecker)
  }

  if (ts.isSourceFile(node)) {
    const result: ParsedSamenFunctionDefinition[] = []
    for (const statement of node.statements) {
      if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        if (ts.isVariableStatement(statement)) {
          for (const varDeclr of statement.declarationList.declarations) {
            const func = extractFunctionFromServiceProperty(
              varDeclr,
              typeChecker,
            )
            result.push(func)
          }
        } else {
          return undefined
        }
      }
    }
    return result
  }

  return undefined
}
