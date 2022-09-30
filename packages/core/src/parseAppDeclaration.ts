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
    errors: ts.ClassDeclaration[]
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
  errors: ts.ClassDeclaration[]
  functions: ts.FunctionDeclaration[]
  context: ts.TypeNode | undefined
}

export function parseAppDeclarationFileContent(dts: string): {
  result: ParsedAppDeclaration
  typeChecker: ts.TypeChecker
} {
  const vHost = new VirtualCompilerHost()
  vHost.addFile("api.d.ts", dts)

  const program = vHost.createProgram("api.d.ts")

  program.emit()

  const sourceFile = program.getSourceFile("api.d.ts")

  if (!sourceFile) {
    throw new Error("Can't compile declaration file")
  }

  const result = parseAppDeclarationSourceFile(sourceFile)

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
      [versionModule.name]: parseServiceDeclarationVersion(
        versionModule.statements,
      ),
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
    ({ models, functions, context, errors }, st) => {
      if (isModel(st)) {
        return { models: [...models, st], functions, context, errors }
      }
      if (ts.isFunctionDeclaration(st)) {
        return {
          models,
          functions: [...functions, st],
          context: context ?? parseContextType(st),
          errors,
        }
      }
      if (ts.isClassDeclaration(st)) {
        return {
          models,
          functions,
          context,
          errors: [...errors, st],
        }
      }
      throw new ParseError(
        "S103: We only support enums, functions, Error classes, interfaces and type aliases",
        st,
      )
    },
    {
      models: [],
      functions: [],
      context: undefined,
      errors: [],
    } as ParsedServiceDeclarationVersion,
  )
}

function parseContextType(
  func: ts.FunctionDeclaration,
): ts.TypeNode | undefined {
  const firstParam = func.parameters[0]
  if (
    firstParam &&
    firstParam.type &&
    ts.isTypeReferenceNode(firstParam.type) &&
    getNameAsString(firstParam.type.typeName) === "SamenContext"
  ) {
    return firstParam.type.typeArguments?.[0]
  }

  return undefined
}

export function isModel(node: ts.Node): node is Model {
  return (
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node)
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
  throw new ParseError("S104: Unexpected statement", statement)
}

function isUserModule(statement: ts.Statement): boolean {
  return (
    !ts.isModuleDeclaration(statement) ||
    // skip the samen namespace
    statement.name.text != "samen"
  )
}
