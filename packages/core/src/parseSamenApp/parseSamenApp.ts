import ts, { ClassDeclaration } from "typescript"
import { ParseError } from "../errors"
import { ParsedError } from "../extractErrors/parseThrowStatement"
import parseServiceDefinition from "./parseServiceDefinition"
import { hasModifier } from "../tsUtils"

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
  actualFunction: ts.FunctionLikeDeclarationBase
  parameters: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  serviceContext?: {
    type: ts.TypeNode
    paramName?: string
  }
}

export interface ParsedSamenServiceConfig {
  middleware?: ParsedMiddlewareConfig[]
  contextType?: ts.TypeNode
}

export interface ParsedMiddlewareConfig {
  paramsType: ts.TypeNode
  nextType: ts.TypeNode | undefined
  contextType: ts.TypeNode
  middleware: ts.FunctionLikeDeclarationBase
}

export function parseSamenApp(
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
        const service = parseServiceDefinition(varDeclr, typeChecker)
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
        const service = parseServiceDefinition(specifier, typeChecker)
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
      models: removeShared(deduplicate(service.models), sharedModels),
      errors: deduplicate(
        service.errors.filter((e) => !sharedErrorClasses.includes(e.ref)),
      ),
    })),
  }
}

function removeShared<T>(objs: T[], sharedObjs: T[]): T[] {
  return objs.filter((m) => !sharedObjs.includes(m))
}

function deduplicate<T>(objs: T[]): T[] {
  return objs.reduce(
    (result, obj) => (result.includes(obj) ? result : [...result, obj]),
    [] as T[],
  )
}
