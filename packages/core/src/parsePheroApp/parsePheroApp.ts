import ts from "typescript"
import { ParseError } from "../errors"
import { ParsedError } from "../extractErrors/parseThrowStatement"
import { hasModifier } from "../tsUtils"
import parseServiceDefinition from "./parseServiceDefinition"

export interface ParsedPheroApp {
  models: Model[]
  errors: ParsedError[]
  services: ParsedPheroServiceDefinition[]
}

export interface ParsedPheroServiceDefinition {
  name: string
  models: Model[]
  errors: ParsedError[]
  funcs: ParsedPheroFunctionDefinition[]
  config: ParsedPheroServiceConfig
}

export type Model =
  | ts.InterfaceDeclaration
  | ts.TypeAliasDeclaration
  | ts.EnumDeclaration

export interface ParsedPheroFunctionDefinition {
  name: string
  actualFunction: ts.FunctionLikeDeclarationBase
  parameters: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  serviceContext?: {
    type: ts.TypeNode
    paramName?: string
  }
}

export interface ParsedPheroServiceConfig {
  middleware?: ParsedMiddlewareConfig[]
  contextType?: ts.TypeNode
}

export interface ParsedMiddlewareConfig {
  paramsType: ts.TypeNode
  nextType: ts.TypeNode | undefined
  contextType: ts.TypeNode
  middleware: ts.FunctionLikeDeclarationBase
}

export function parsePheroApp(
  pheroSourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
): ParsedPheroApp {
  const exportStatements = pheroSourceFile.statements.filter(
    (s) =>
      hasModifier(s, ts.SyntaxKind.ExportKeyword) || ts.isExportDeclaration(s),
  )

  const services: ParsedPheroServiceDefinition[] = []

  for (const statement of exportStatements) {
    if (ts.isVariableStatement(statement)) {
      for (const varDeclr of statement.declarationList.declarations) {
        const service = parseServiceDefinition(varDeclr, typeChecker)
        services.push(service)
      }
    } else if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause) {
        throw new ParseError(
          `S123: "export * from './file'" are not supported`,
          statement,
        )
      } else if (!ts.isNamedExports(statement.exportClause)) {
        throw new ParseError("S124: Unsupported export statement", statement)
      }

      for (const specifier of statement.exportClause.elements) {
        const service = parseServiceDefinition(specifier, typeChecker)
        services.push(service)
      }
    } else {
      throw new ParseError("S125: Unsupported export statement", statement)
    }
  }

  const modelMap: Map<string, Model> = new Map<string, Model>()
  const errorMap: Map<string, ParsedError> = new Map<string, ParsedError>()

  for (const service of services) {
    for (const model of service.models) {
      const modelName = model.name.text

      if (modelName === "PheroContext") {
        continue
      }

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
