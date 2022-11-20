import ts from "typescript"
import { ParseError } from "../domain/errors"
import parseCreateServiceCallExpression from "./parseCreateServiceCallExpression"
import { parseContext } from "./parseContext"
import parseFunctionDefinitions from "./parseFunctionDefinitions"
import {
  PheroFunction,
  PheroService,
  PheroServiceConfig,
} from "../domain/PheroApp"
import parseServiceConfig from "./parseServiceConfig"

export default function parseServiceDefinition(
  serviceExport: ts.VariableDeclaration | ts.ExportSpecifier,
  prog: ts.Program,
): PheroService {
  const typeChecker = prog.getTypeChecker()
  const serviceName = serviceExport.name.getText()

  // check if the value of the export is a function call to "creatService"
  const createServiceCallExpr = parseCreateServiceCallExpression(
    serviceExport,
    prog,
  )

  if (!createServiceCallExpr) {
    throw new ParseError("S127: Cant find service export", serviceExport)
  }

  // parsing arguments of createService
  const [functionDefsArg, serviceConfigArg] = createServiceCallExpr.arguments

  const [pheroServiceConfig, pheroFunctions]: [
    PheroServiceConfig,
    PheroFunction[],
  ] = parseContext(
    parseServiceConfig(serviceConfigArg, prog),
    parseFunctionDefinitions(functionDefsArg, typeChecker),
    prog,
  )

  if (pheroFunctions.length === 0) {
    throw new ParseError(
      "S128: Can't find function definitions",
      createServiceCallExpr,
    )
  }

  return {
    name: serviceName,
    funcs: pheroFunctions,
    config: pheroServiceConfig,
    ref: serviceExport,
  }
}
