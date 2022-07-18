import ts, { ClassDeclaration } from "typescript"
import { ParseError } from "./errors"
import { ParsedError } from "./extractErrors/parseThrowStatement"
import extractServiceFromSamenExport from "./extractServiceFromSamenExport"
import { hasModifier } from "./tsUtils"

export interface ParsedSamenApp {
  models: Model[]
  errors: ParsedError[]
  services: ParsedSamenServiceDefinition[]
}

export interface ParsedSamenServiceDefinition {
  name: string
  models: Model[]
  errors: ParsedError[]
  funcs: ParsedSamenFunctionDefinition[]
  config: ParsedSamenServiceConfig
}

export type Model =
  | ts.InterfaceDeclaration
  | ts.TypeAliasDeclaration
  | ts.EnumDeclaration

export interface ParsedSamenFunctionDefinition {
  name: string
  // TODO for clashing service models
  // models: Model[]
  actualFunction: ts.FunctionLikeDeclarationBase
  parameters: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  config: ParsedSamenFunctionConfig
  serviceContext?: {
    type: ts.TypeNode
    paramName?: string
  }
}

export interface ParsedSamenServiceConfig {
  memory?: number
  timeout?: number

  minInstance?: number
  maxInstance?: number
  middleware?: ParsedMiddlewareConfig[]
  contextType?: ts.TypeNode
}

export interface ParsedSamenFunctionConfig {
  memory?: number
  timeout?: number
}

export interface ParsedMiddlewareConfig {
  paramsType: ts.TypeNode
  nextType: ts.TypeNode | undefined
  contextType: ts.TypeNode
  middleware: ts.FunctionLikeDeclarationBase
}

export enum SamenLibFunctions {
  CreateService = "createService",
  CreateFunction = "createFunction",
}

export default function parseSamenApp(
  samenSourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
): ParsedSamenApp {
  const exportStatements = samenSourceFile.statements.filter(
    (s) =>
      hasModifier(s, ts.SyntaxKind.ExportKeyword) || ts.isExportDeclaration(s),
  )

  const services: ParsedSamenServiceDefinition[] = []

  for (const statement of exportStatements) {
    if (ts.isVariableStatement(statement)) {
      for (const varDeclr of statement.declarationList.declarations) {
        const service = extractServiceFromSamenExport(varDeclr, typeChecker)
        services.push(service)
      }
    } else if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause) {
        throw new ParseError(
          `"export * from './file'" are not supported`,
          statement,
        )
      } else if (!ts.isNamedExports(statement.exportClause)) {
        throw new ParseError("Unsupported export statement", statement)
      }

      for (const specifier of statement.exportClause.elements) {
        const service = extractServiceFromSamenExport(specifier, typeChecker)
        services.push(service)
      }
    } else {
      throw new ParseError("Unsupported export statement", statement)
    }
  }

  const modelMap: Map<Model, string[]> = new Map<Model, string[]>()

  for (const service of services) {
    for (const model of service.models) {
      if (modelMap.has(model)) {
        if (!modelMap.get(model)!.includes(service.name)) {
          modelMap.set(model, [...modelMap.get(model)!, service.name])
        }
      } else {
        modelMap.set(model, [service.name])
      }
    }
  }

  const sharedModels: Model[] = []
  for (const [model, serviceNames] of modelMap) {
    if (serviceNames.length > 1) {
      sharedModels.push(model)
    }
  }

  const errorMap: Map<ClassDeclaration, string[]> = new Map<
    ClassDeclaration,
    string[]
  >()

  for (const service of services) {
    for (const { ref: errorClass } of service.errors) {
      if (errorMap.has(errorClass)) {
        if (!errorMap.get(errorClass)!.includes(service.name)) {
          errorMap.set(errorClass, [...errorMap.get(errorClass)!, service.name])
        }
      } else {
        errorMap.set(errorClass, [service.name])
      }
    }
  }

  const sharedErrors: ParsedError[] = []
  const sharedErrorClasses: ClassDeclaration[] = []

  const allParsedErrors = services.flatMap((s) => s.errors)
  for (const [errorClass, serviceNames] of errorMap) {
    if (serviceNames.length > 1) {
      const parsedErr = allParsedErrors.find((e) => e.ref === errorClass)!

      sharedErrors.push(parsedErr)
      sharedErrorClasses.push(errorClass)
    }
  }

  return {
    models: sharedModels,
    errors: sharedErrors,
    services: services.map((service) => ({
      ...service,
      models: service.models.filter((m) => !sharedModels.includes(m)),
      errors: service.errors.filter((e) => !sharedErrorClasses.includes(e.ref)),
    })),
  }
}
