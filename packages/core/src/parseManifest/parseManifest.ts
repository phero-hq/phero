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
  generateParserModelForFunction,
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
      const inheritedClassRef =
        statement.heritageClauses?.[0].types?.[0].expression
      if (inheritedClassRef && ts.isIdentifier(inheritedClassRef)) {
        if (inheritedClassRef.text === "Error") {
          errors.push(makePheroError(statement, typeChecker, deps))
        } else if (inheritedClassRef.text === "PheroService") {
          services.push(parseServiceDeclaration(statement, typeChecker, deps))
        }
      }
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
  const { name, properties, errorModel } = generateParserModelForError(
    error,
    typeChecker,
    deps,
  )

  return {
    name,
    sourceFile: "manifest.d.ts",
    ref: error,
    properties,
    errorModel,
  }
}

function parseServiceDeclaration(
  classDeclr: ts.ClassDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroService {
  if (!classDeclr.name) {
    throw new Error("PheroService must have name")
  }

  const funcs = classDeclr.members.filter((st): st is ts.MethodDeclaration =>
    ts.isMethodDeclaration(st),
  )

  const contextType =
    classDeclr.heritageClauses?.[0].types?.[0].typeArguments?.[0]

  if (contextType && !ts.isTypeLiteralNode(contextType)) {
    throw new Error("Wrong syntax for context type")
  }

  const pheroService: PheroService = {
    name: classDeclr.name.text,
    funcs: funcs.map((func) =>
      parseFunctionDeclaration(func, typeChecker, deps),
    ),
    config: {
      middleware: [],
      contextType,
    },
    ref: classDeclr,
  }
  return pheroService
}

function parseFunctionDeclaration(
  func: ts.MethodDeclaration,
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
  func: ts.MethodDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): Pick<PheroFunction, "returnTypeModel" | "parameters" | "parametersModel"> {
  const functionModel = generateParserModelForFunction(func, typeChecker, deps)

  return {
    returnTypeModel: functionModel.returnType,
    parameters: func.parameters.map((param) => ({
      name: getNameAsString(param.name),
      questionToken: !!param.questionToken,
      type: getOrThrow(param.type, "Parameter must have type"),
    })),
    parametersModel: functionModel.parameters,
  }
}
