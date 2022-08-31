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

  const modelMap: Map<string, Model> = new Map<string, Model>()
  const errorMap: Map<string, ParsedError> = new Map<string, ParsedError>()

  for (const service of services) {
    for (const model of service.models) {
      const modelName = model.name.text
      if (!modelMap.has(modelName)) {
        modelMap.set(modelName, model)
      } else if (modelMap.get(modelName) !== model) {
        throw new ParseError(
          "You already have a different model with the same name, currently this is not possible. We intent to implement namespaces soon, stay tuned.",
          model,
        )
      }
    }
    for (const parsedError of service.errors) {
      const errorName = parsedError.name
      if (!errorMap.has(errorName)) {
        errorMap.set(errorName, parsedError)
      } else if (errorMap.get(errorName)?.ref !== parsedError.ref) {
        throw new ParseError(
          "You already have a different error class with the same name, currently this is not possible. We intent to implement namespaces soon, stay tuned.",
          parsedError.ref,
        )
      }
    }
  }

  return {
    models: [...modelMap.values()],
    errors: [...errorMap.values()],
    services,
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
