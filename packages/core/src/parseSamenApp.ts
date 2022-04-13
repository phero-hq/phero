import ts from "typescript"
import { ParseError } from "./errors"
import extractServiceFromSamenExport from "./extractServiceFromSamenExport"
import { hasModifier } from "./tsUtils"

export interface ParsedSamenApp {
  models: Model[]
  services: ParsedSamenServiceDefinition[]
}

export interface ParsedSamenServiceDefinition {
  name: string
  models: Model[]
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
  context?: {
    name: string
    type: ts.TypeNode
  }
}

export interface ParsedSamenServiceConfig {
  memory?: number
  timeout?: number

  minInstance?: number
  maxInstance?: number
  middleware?: ParsedMiddlewareConfig[]
}

export interface ParsedSamenFunctionConfig {
  memory?: number
  timeout?: number
}

export interface ParsedMiddlewareConfig {
  paramsType: ts.TypeNode
  nextType: ts.TypeNode
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
  const t1 = Date.now()

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

  const seen: Model[] = []
  const shared: Model[] = []

  for (const model of services.flatMap((s) => s.models)) {
    if (shared.includes(model)) {
      continue
    } else if (seen.includes(model)) {
      if (!shared.includes(model)) {
        shared.push(model)
      }
    } else {
      seen.push(model)
    }
  }

  const t2 = Date.now()
  // console.log("parseSamenApp in", t2 - t1)
  return {
    models: shared,
    services: services.map((service) => ({
      ...service,
      models: service.models.filter((m) => !shared.includes(m)),
    })),
  }
}
