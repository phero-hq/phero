import ts from "typescript"
import {
  Model,
  PheroApp,
  PheroError,
  PheroErrorProperty,
  PheroFunction,
  PheroModel,
  PheroService,
} from "../domain/PheroApp"
import parseReturnType from "../parsePheroApp/parseReturnType"
import { getNameAsString } from "../lib/tsUtils"
import { VirtualCompilerHost } from "../lib/VirtualCompilerHost"

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

  const result = parseManifestSourceFile(sourceFile)

  return { result, program }
}

function parseManifestSourceFile(sourceFile: ts.SourceFile): PheroApp {
  const [domainModule] = findModules(sourceFile, (name) => name === "domain")
  const serviceModules = findModules(
    sourceFile,
    (name) => !["domain", "phero"].includes(name),
  )

  const [models, errors] = parseDomainDeclarations(domainModule)
  const services = parseServiceDeclarations(serviceModules)

  return {
    errors,
    models,
    services,
  }
}

interface Module {
  name: string
  statements: ts.Statement[]
  ref: ts.Node
}

function findModules(
  sourceFile: ts.SourceFile,
  predicate: (name: string) => boolean,
): Module[] {
  const matchingModules: ts.ModuleDeclaration[] = sourceFile.statements.filter(
    (statement): statement is ts.ModuleDeclaration =>
      ts.isModuleDeclaration(statement) && predicate(statement.name.text),
  )

  return matchingModules.reduce<Module[]>((result, module) => {
    if (
      module?.body &&
      ts.isModuleBlock(module.body) &&
      module.body.statements.length === 1 &&
      ts.isModuleDeclaration(module.body.statements[0]) &&
      module.body.statements[0].name.text.startsWith("v_") &&
      module.body.statements[0].body &&
      ts.isModuleBlock(module.body.statements[0].body)
    ) {
      return [
        ...result,
        {
          name: getNameAsString(module.name),
          statements: module.body.statements[0].body.statements.map((st) => st),
          ref: module.body.statements[0].body,
        },
      ]
    }

    return result
  }, [])
}

function getOrThrow<T>(node: T | undefined, errorMessage: string): T {
  if (!node) {
    throw new Error(errorMessage)
  }

  return node
}

function parseDomainDeclarations(
  domainModule: Module,
): [PheroModel[], PheroError[]] {
  return domainModule.statements.reduce<[PheroModel[], PheroError[]]>(
    ([models, errors], statement) => {
      if (isModel(statement)) {
        return [
          [
            ...models,
            {
              name: statement.name.text,
              ref: statement,
            },
          ],
          errors,
        ]
      } else if (ts.isClassDeclaration(statement) && statement.name) {
        return [
          models,
          [
            ...errors,
            {
              name: statement.name.text,
              sourceFile: "manifest.d.ts",
              properties: parseErrorProperties(statement),
              ref: statement,
            },
          ],
        ]
      } else {
        return [models, errors]
      }
    },
    [[], []],
  )
}

function parseErrorProperties(
  errorClass: ts.ClassDeclaration,
): PheroErrorProperty[] {
  const constructor: ts.ConstructorDeclaration = getOrThrow(
    errorClass.members.find((member): member is ts.ConstructorDeclaration =>
      ts.isConstructorDeclaration(member),
    ),
    "Error must have constructor",
  )

  return constructor.parameters.map((param) => ({
    name: getNameAsString(param.name),
    type: getOrThrow(param.type, "Constructor parameter must have type"),
  }))
}

function parseServiceDeclarations(serviceModules: Module[]): PheroService[] {
  return serviceModules.map((serviceModule) => {
    return {
      name: serviceModule.name,
      funcs: parseFunctionDeclarations(serviceModule),
      config: {},
      ref: serviceModule.ref,
    }
  })
}

function parseFunctionDeclarations(serviceModule: Module): PheroFunction[] {
  const funcs = serviceModule.statements.filter(
    (st): st is ts.FunctionDeclaration => ts.isFunctionDeclaration(st),
  )
  return funcs.map((func) => ({
    name: getOrThrow(func.name?.text, "Function must have name"),
    returnType: parseReturnType(
      getOrThrow(func, "Fucntion must have return type"),
    ),
    ...parseFunctionParams(func),
    ref: func,

    // TODO remove after client refactor,
    parameters: [],
    serviceContext: undefined,
  }))
}

function parseFunctionParams(
  func: ts.FunctionDeclaration,
): Pick<PheroFunction, "parameters2" | "contextParameterType"> {
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

  return {
    contextParameterType,
    parameters2: params.map((param) => ({
      name: getNameAsString(param.name),
      questionToken: !!param.questionToken,
      type: getOrThrow(param.type, "Parameter must have type"),
    })),
  }
}

export function isModel(node: ts.Node): node is Model {
  return (
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node)
  )
}
