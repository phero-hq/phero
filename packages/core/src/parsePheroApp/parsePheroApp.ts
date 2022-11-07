import ts from "typescript"
import { ParseError } from "../errors"
import extractErrors from "../extractErrors/extractErrors"
import { PheroError } from "../extractErrors/parseThrowStatement"
import { hasModifier } from "../tsUtils"
import { PheroApp, PheroModel, PheroService } from "./domain"
import parseModels from "./parseModels"
import parseServiceDefinition from "./parseServiceDefinition"

export function parsePheroApp(
  pheroSourceFile: ts.SourceFile,
  prog: ts.Program,
): PheroApp {
  const exportStatements = pheroSourceFile.statements.filter(
    (s) =>
      hasModifier(s, ts.SyntaxKind.ExportKeyword) || ts.isExportDeclaration(s),
  )

  const services: PheroService[] = []

  for (const statement of exportStatements) {
    if (ts.isVariableStatement(statement)) {
      for (const varDeclr of statement.declarationList.declarations) {
        const service = parseServiceDefinition(varDeclr, prog)
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
        const service = parseServiceDefinition(specifier, prog)
        services.push(service)
      }
    } else {
      throw new ParseError("S125: Unsupported export statement", statement)
    }
  }

  const modelMap: Map<string, PheroModel> = new Map<string, PheroModel>()
  const errorMap: Map<string, PheroError> = new Map<string, PheroError>()

  for (const service of services) {
    for (const func of service.funcs) {
      for (const model of parseModels(func, prog)) {
        const modelName = model.name

        if (modelName === "PheroContext") {
          continue
        }

        if (!modelMap.has(modelName)) {
          modelMap.set(modelName, model)
        } else if (modelMap.get(modelName) !== model) {
          throw new ParseError(
            "You already have a different model with the same name, currently this is not possible. We intent to implement namespaces soon, stay tuned.",
            model.ref,
          )
        }
      }
    }
  }

  const allErrors = extractErrors(
    [
      ...services.flatMap((service) => [
        ...service.funcs.map((func) => func.ref),
        ...(service.config.middleware?.map((m) => m.middleware) ?? []),
      ]),
    ],
    prog,
  )

  for (const parsedError of allErrors) {
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

  return {
    models: [...modelMap.values()],
    errors: [...errorMap.values()],
    services,
  }
}
