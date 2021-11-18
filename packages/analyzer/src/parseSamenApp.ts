import ts from "typescript"
import { ParseError } from "./errors"
import extractServiceFromSamenExport from "./extractServiceFromSamenExport"
import { hasModifier } from "./tsUtils"

export interface ParsedSamenApp {
  services: ParsedSamenServiceDefinition[]
}

export interface ParsedSamenServiceDefinition {
  name: string
  funcs: ParsedSamenFunctionDefinition[]
}

export interface ParsedSamenFunctionDefinition {
  name: string
  actualFunction: ts.FunctionLikeDeclarationBase
  parameters: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  config: ParsedSamenFunctionConfig
}

export interface ParsedSamenFunctionConfig {
  memory?: number
  timeout?: number

  minInstance?: number
  maxInstance?: number
  middleware?: ts.FunctionLikeDeclarationBase[]
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
      console.log("SAT", statement.kind)
      throw new ParseError("Unsupported export statement", statement)
    }
  }

  const t2 = Date.now()
  console.log("parseSamenApp in", t2 - t1)
  return { services }
}
