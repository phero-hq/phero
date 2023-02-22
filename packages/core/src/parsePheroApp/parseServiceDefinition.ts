import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import parseCreateServiceCallExpression from "./parseCreateServiceCallExpression"
import { parseContext } from "./parseContext"
import parseFunctionDefinitions from "./parseFunctionDefinitions"
import {
  PheroFunction,
  PheroService,
  PheroServiceConfig,
} from "../domain/PheroApp"
import parseServiceConfig from "./parseServiceConfig"
import { DependencyMap } from "../generateModel"

export default function parseServiceDefinition(
  serviceExport: ts.VariableDeclaration | ts.ExportSpecifier,
  prog: ts.Program,
  deps: DependencyMap,
): PheroService {
  const typeChecker = prog.getTypeChecker()
  const serviceName = serviceExport.name.getText()

  // check if the value of the export is a function call to "creatService"
  const createServiceCallExpr = parseCreateServiceCallExpression(
    serviceExport,
    prog,
  )

  if (!createServiceCallExpr) {
    throw new PheroParseError("S127: Cant find service export", serviceExport)
  }

  // parsing arguments of createService
  const [functionDefsArg, serviceConfigArg] = createServiceCallExpr.arguments

  const [pheroServiceConfig, pheroFunctions]: [
    PheroServiceConfig,
    PheroFunction[],
  ] = parseContext(
    parseServiceConfig(serviceConfigArg, prog),
    parseFunctionDefinitions(functionDefsArg, typeChecker, deps),
    prog,
  )

  if (pheroFunctions.length === 0) {
    throw new PheroParseError(
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
