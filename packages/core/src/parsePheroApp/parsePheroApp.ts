import ts from "typescript"
import { MissingPheroFileError, PheroParseError } from "../domain/errors"
import extractErrors from "../extractErrors/extractErrors"
import { hasModifier } from "../lib/tsUtils"
import {
  PheroApp,
  PheroError,
  PheroModel,
  PheroService,
} from "../domain/PheroApp"
import {
  parseErrorModels,
  parseFunctionModels,
  parseMiddlewareModels,
} from "./parseModels"
import parseServiceDefinition from "./parseServiceDefinition"
import { DependencyMap, generateParserModelForError } from "../generateModel"

export function parsePheroApp(prog: ts.Program): PheroApp {
  const pheroSourceFiles = prog
    .getSourceFiles()
    .filter(
      (sourceFile) =>
        sourceFile.fileName === "phero.ts" ||
        sourceFile.fileName.endsWith("/phero.ts"),
    )

  if (pheroSourceFiles.length === 0) {
    throw new MissingPheroFileError(prog.getCurrentDirectory())
  }

  const deps: DependencyMap = new Map()

  const pheroServices = pheroSourceFiles.flatMap((pheroSourceFile) =>
    parsePheroServices(pheroSourceFile, prog, deps),
  )

  assertUniqueServiceNames(pheroServices)

  const modelMap: Map<string, PheroModel> = new Map<string, PheroModel>()
  const errorMap: Map<string, PheroError> = new Map<string, PheroError>()

  const allErrors = extractErrors(
    [
      ...pheroServices.flatMap((service) => [
        ...service.funcs.map((func) => func.ref),
        ...service.config.middleware.map((m) => m.middleware),
      ]),
    ],
    prog,
  )

  for (const error of allErrors) {
    const { name, properties, errorModel } = generateParserModelForError(
      error,
      prog.getTypeChecker(),
      deps,
    )

    if (!errorMap.has(name)) {
      errorMap.set(name, {
        name,
        ref: error,
        sourceFile: error.getSourceFile().fileName,
        properties,
        errorModel,
      })
    } else if (errorMap.get(name)?.ref !== error) {
      throw new PheroParseError(
        "You already have a different error class with the same name, currently this is not possible. We intent to implement namespaces soon, stay tuned.",
        error,
      )
    }
  }

  const models: PheroModel[] = [
    ...pheroServices.flatMap((service) => [
      ...service.funcs.flatMap((func) => parseFunctionModels(func, prog)),
      ...(service.config.middleware
        ? parseMiddlewareModels(service.config.middleware, prog)
        : []),
    ]),
    ...parseErrorModels([...errorMap.values()], prog),
  ]

  for (const model of models) {
    const modelName = model.name
    if (!modelMap.has(modelName)) {
      modelMap.set(modelName, model)
    } else if (modelMap.get(modelName)?.ref !== model.ref) {
      throw new PheroParseError(
        `You already have a different model with the same name (${modelName}), currently this is not possible. We intent to implement namespaces soon, stay tuned.`,
        model.ref,
      )
    }
  }

  return {
    models: [...modelMap.values()],
    errors: [...errorMap.values()],
    services: pheroServices,
    deps,
  }
}

function parsePheroServices(
  pheroSourceFile: ts.SourceFile,
  prog: ts.Program,
  deps: DependencyMap,
): PheroService[] {
  const exportStatements = pheroSourceFile.statements.filter(
    (s) =>
      hasModifier(s, ts.SyntaxKind.ExportKeyword) || ts.isExportDeclaration(s),
  )

  const services: PheroService[] = []

  for (const statement of exportStatements) {
    if (ts.isVariableStatement(statement)) {
      for (const varDeclr of statement.declarationList.declarations) {
        const service = parseServiceDefinition(varDeclr, prog, deps)
        services.push(service)
      }
    } else if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause) {
        throw new PheroParseError(
          `S123: "export * from './file'" are not supported`,
          statement,
        )
      } else if (!ts.isNamedExports(statement.exportClause)) {
        throw new PheroParseError(
          "S124: Unsupported export statement",
          statement,
        )
      }

      for (const specifier of statement.exportClause.elements) {
        const service = parseServiceDefinition(specifier, prog, deps)
        services.push(service)
      }
    } else {
      throw new PheroParseError("S125: Unsupported export statement", statement)
    }
  }

  return services
}

function assertUniqueServiceNames(pheroServices: PheroService[]): void {
  const serviceNames: string[] = []

  for (const service of pheroServices) {
    if (serviceNames.includes(service.name)) {
      throw new PheroParseError(
        "You already have a service with the same name.",
        service.ref,
      )
    }

    serviceNames.push(service.name)
  }
}
