import type ts from "typescript"
import { tsx } from ".."
import { PheroParseError } from "../domain/errors"
import { type PheroService, type PheroServiceConfig } from "../domain/PheroApp"
import {
  type DependencyMap,
  generateParserModelForServiceContext,
} from "../generateModel"
import parseCreateServiceCallExpression from "./parseCreateServiceCallExpression"
import parseFunctionDefinitions from "./parseFunctionDefinitions"
import parseServiceConfig from "./parseServiceConfig"
import parseServiceContextType, {
  type ServiceContext,
} from "./parseServiceContextType"

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

  const serviceConfig = parseServiceConfig(serviceConfigArg, prog, deps)
  const pheroFunctions = parseFunctionDefinitions(
    functionDefsArg,
    typeChecker,
    deps,
  )

  if (pheroFunctions.length === 0) {
    throw new PheroParseError(
      "S128: Can't find function definitions",
      createServiceCallExpr,
    )
  }

  const serviceContextConfig = parseServiceContextType(
    serviceConfig,
    pheroFunctions,
    deps,
  )

  return {
    name: serviceName,
    funcs: pheroFunctions,
    config: {
      ...serviceConfig,
      ...generateServiceContextProps(serviceContextConfig, typeChecker, deps),
    },
    ref: serviceExport,
  }
}

function generateServiceContextProps(
  serviceContext: ServiceContext | undefined,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): Pick<
  PheroServiceConfig,
  "isRequestPopulated" | "contextType" | "contextTypeModel"
> {
  if (!serviceContext) {
    return {}
  }

  const contextType = tsx.literal.type(
    ...serviceContext.properties.map((p) => p.signature),
  )

  const { root: contextTypeModel } = generateParserModelForServiceContext(
    serviceContext,
    typeChecker,
    deps,
  )

  return {
    isRequestPopulated: serviceContext.isRequestPopulated,
    contextType,
    contextTypeModel,
  }
}
