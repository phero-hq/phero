import ts from "typescript"
import { ParseError } from "./errors"
import { Model } from "./parseSamenApp"
import { VirtualCompilerHost } from "./VirtualCompilerHost"

export interface ParsedAppDeclaration {
  domain: ParsedDomainDeclaration
  services: ParsedServiceDeclaration[]
}

export interface ParsedDomainDeclaration {
  [version: string]: {
    models: Model[]
  }
}

export interface ParsedServiceDeclaration {
  name: string
  versions: ParsedServiceDeclarationVersions
}

export interface ParsedServiceDeclarationVersions {
  [version: string]: {
    models: Model[]
    functions: ts.FunctionDeclaration[]
  }
}

export function parseAppDeclarationFileContent(dts: string): {
  result: ParsedAppDeclaration
  typeChecker: ts.TypeChecker
} {
  const t1 = Date.now()

  const vHost = new VirtualCompilerHost()
  vHost.addFile("api.d.ts", dts)

  const program = vHost.createProgram("api.d.ts")

  const emitResult = program.emit()

  const sourceFile = program.getSourceFile("api.d.ts")

  if (!sourceFile) {
    throw new Error("Can't compile declaration file")
  }

  const result = parseAppDeclarationSourceFile(sourceFile)

  const t2 = Date.now()

  // console.debug("parseAppDeclaration in", t2 - t1)

  return { result, typeChecker: program.getTypeChecker() }
}

function parseAppDeclarationSourceFile(
  sourceFile: ts.SourceFile,
): ParsedAppDeclaration {
  const modules: ParsedModule[] = sourceFile.statements.map(parseModule)

  const domainModule: ParsedModule | undefined = modules.find(
    (m) => m.name === "domain",
  )
  const serviceModules: ParsedModule[] = modules.filter(
    (m) => m.name !== "domain",
  )

  const parsedDomainDeclr: ParsedDomainDeclaration = domainModule
    ? parseDomainDeclarations(domainModule)
    : {}

  const parsedServicesDeclarations = serviceModules.map(parseServiceDeclaration)

  return {
    domain: parsedDomainDeclr,
    services: parsedServicesDeclarations,
  }
}

function parseDomainDeclarations({
  statements,
}: ParsedModule): ParsedDomainDeclaration {
  const versionModules = statements.map(parseModule)
  return versionModules.reduce(
    (result, versionModule) => ({
      ...result,
      [versionModule.name]: {
        models: versionModule.statements.map((st) => {
          const model = parseModel(st)
          if (!model) {
            throw new ParseError("Unexpected statement", st)
          }
          return model
        }),
      },
    }),
    {},
  )
}

function parseServiceDeclaration({
  name,
  statements,
}: ParsedModule): ParsedServiceDeclaration {
  const versionModules = statements.map(parseModule)
  return {
    name,
    versions: versionModules.reduce(
      (result, versionModule) => ({
        ...result,
        [versionModule.name]: versionModule.statements.reduce(
          ({ models, functions }, st) => {
            const model = parseModel(st)
            if (model) {
              return { models: [...models, model], functions }
            }
            const func = parseFunction(st)
            if (func) {
              return { models, functions: [...functions, func] }
            }
            throw new ParseError("Neither model nor function", st)
          },
          {
            models: [] as Model[],
            functions: [] as ts.FunctionDeclaration[],
          },
        ),
      }),
      {} as ParsedServiceDeclaration["versions"],
    ),
  }
}

function parseModel(statement: ts.Statement): Model | undefined {
  if (
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement)
  ) {
    return statement
  }
}

function parseFunction(
  statement: ts.Statement,
): ts.FunctionDeclaration | undefined {
  if (ts.isFunctionDeclaration(statement)) {
    return statement
  }
}

interface ParsedModule {
  name: string
  statements: ts.Statement[]
}

function parseModule(statement: ts.Statement): ParsedModule {
  if (
    ts.isModuleDeclaration(statement) &&
    statement?.body &&
    ts.isModuleBlock(statement.body)
  ) {
    return {
      name: statement.name.getText(),
      statements: statement.body.statements.map((st) => st),
    }
  }
  throw new ParseError("Unexpected statement", statement)
}
