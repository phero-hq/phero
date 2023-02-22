import ts from "typescript"
import {
  Model,
  PheroApp,
  PheroError,
  PheroFunction,
  PheroModel,
  PheroService,
} from "../domain/PheroApp"
import parseReturnType from "../parsePheroApp/parseReturnType"
import { getNameAsString } from "../lib/tsUtils"
import { VirtualCompilerHost } from "../lib/VirtualCompilerHost"
import {
  DependencyMap,
  generateParserModel,
  generateParserModelForError,
} from "../generateModel"

export default function parseManifest(dts: string): {
  result: PheroApp
  program: ts.Program
} {
  const vHost = new VirtualCompilerHost()
  vHost.addFile("api.d.ts", dts)

  const program = vHost.createProgram("api.d.ts")

  program.emit()

  const sourceFile = program.getSourceFile("api.d.ts")

  if (!sourceFile) {
    throw new Error("Can't compile declaration file")
  }

  const result = parseManifestSourceFile(sourceFile, program.getTypeChecker())

  return { result, program }
}

function parseManifestSourceFile(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
): PheroApp {
  const deps: DependencyMap = new Map()

  const models: PheroModel[] = []
  const errors: PheroError[] = []
  const services: PheroService[] = []

  for (const statement of sourceFile.statements) {
    if (isModel(statement)) {
      models.push(makePheroModel(statement))
    } else if (ts.isClassDeclaration(statement)) {
      errors.push(makePheroError(statement, typeChecker, deps))
    } else if (ts.isModuleDeclaration(statement)) {
      services.push(parseServiceDeclaration(statement, typeChecker, deps))
    } else {
      throw new Error("Unsupported statement in phero-manifest.d.ts")
    }
  }

  return {
    models,
    errors,
    services,
    deps,
  }
}

export function isModel(node: ts.Node): node is Model {
  return (
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node)
  )
}

function makePheroModel(model: Model): PheroModel {
  return {
    name: model.name.text,
    ref: model,
  }
}

function makePheroError(
  error: ts.ClassDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroError {
  const { properties, errorModel } = generateParserModelForError(
    error,
    typeChecker,
    deps,
  )

  if (!error.name) {
    throw new Error("Error without name found in phero-manifest.d.ts")
  }

  return {
    name: error.name.text,
    sourceFile: "manifest.d.ts",
    ref: error,
    properties,
    errorModel,
  }
}

function parseServiceDeclaration(
  moduleDeclr: ts.ModuleDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroService {
  if (!moduleDeclr.body || !ts.isModuleBlock(moduleDeclr.body)) {
    throw new Error("Unexpected service declaration")
  }

  const funcs = moduleDeclr.body.statements.filter(
    (st): st is ts.FunctionDeclaration => ts.isFunctionDeclaration(st),
  )

  const pheroService: PheroService = {
    name: moduleDeclr.name.text,
    funcs: funcs.map((func) =>
      parseFunctionDeclaration(func, typeChecker, deps),
    ),
    config: {},
    ref: moduleDeclr,
  }
  return pheroService
}

function parseFunctionDeclaration(
  func: ts.FunctionDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroFunction {
  if (!func.name) {
    throw new Error("func no name")
  }

  const pheroFunction: PheroFunction = {
    name: getNameAsString(func.name),
    returnType: parseReturnType(func),
    ...parseFunctionParams(func, typeChecker, deps),
    ref: func,
  }
  return pheroFunction
}

function getOrThrow<T>(node: T | undefined, errorMessage: string): T {
  if (!node) {
    throw new Error(errorMessage)
  }

  return node
}

function parseFunctionParams(
  func: ts.FunctionDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): Pick<
  PheroFunction,
  "parameters" | "contextParameterType" | "parametersModel" | "returnTypeModel"
> {
  let contextParameterType: ts.TypeNode | undefined

  const firstParamType = func.parameters[0]?.type

  if (
    firstParamType &&
    ts.isTypeReferenceNode(firstParamType) &&
    getNameAsString(firstParamType.typeName) === "PheroContext" &&
    firstParamType.typeArguments?.length === 1
  ) {
    contextParameterType = firstParamType.typeArguments[0]
  }

  const params = contextParameterType
    ? func.parameters.slice(1)
    : func.parameters

  const functionModel = generateParserModel(func, typeChecker, deps)

  return {
    contextParameterType,
    parameters: params.map((param) => ({
      name: getNameAsString(param.name),
      questionToken: !!param.questionToken,
      type: getOrThrow(param.type, "Parameter must have type"),
    })),
    parametersModel: functionModel.parameters,
    returnTypeModel: functionModel.returnType,
  }
}
