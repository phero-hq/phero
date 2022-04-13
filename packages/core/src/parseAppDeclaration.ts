import ts from "typescript"
import { ParseError } from "./errors"
import { Model } from "./parseSamenApp"
import { getNameAsString } from "./tsUtils"
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
  [version: string]: ParsedServiceDeclarationVersion
}

export interface ParsedServiceDeclarationVersion {
  models: Model[]
  functions: ts.FunctionDeclaration[]
  context: ts.TypeNode | undefined
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
  const modules: ParsedModule[] = sourceFile.statements
    .filter(isUserModule)
    .map(parseModule)

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
          if (!isModel(st)) {
            throw new ParseError("Unexpected statement", st)
          }
          return st
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
        [versionModule.name]: parseServiceDeclarationVersion(
          versionModule.statements,
        ),
      }),
      {} as ParsedServiceDeclaration["versions"],
    ),
  }
}

function parseServiceDeclarationVersion(
  statements: ts.Statement[],
): ParsedServiceDeclarationVersion {
  return statements.reduce(
    ({ models, functions, context }, st) => {
      if (isModel(st)) {
        return { models: [...models, st], functions, context }
      }
      if (ts.isFunctionDeclaration(st)) {
        return {
          models,
          functions: [...functions, st],
          context: context ?? parseContextType(st),
        }
      }
      throw new ParseError("Neither model nor function", st)
    },
    {
      models: [],
      functions: [],
      context: undefined,
    } as ParsedServiceDeclarationVersion,
  )
}

function parseContextType(
  func: ts.FunctionDeclaration,
): ts.TypeNode | undefined {
  const lastParam = func.parameters[func.parameters.length - 1]
  if (
    lastParam &&
    lastParam.type &&
    ts.isTypeReferenceNode(lastParam.type) &&
    getNameAsString(lastParam.type.typeName) === "SamenContext"
  ) {
    return lastParam.type.typeArguments?.[0]
  }

  return undefined
}

function isModel(statement: ts.Statement): statement is Model {
  return (
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement)
  )
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

function isUserModule(statement: ts.Statement): boolean {
  return (
    !ts.isModuleDeclaration(statement) ||
    // skip the samen namespace
    statement.name.text != "samen"
  )
}
