import {
  ts,
  SourceFile,
  TypeChecker,
  Node,
  FunctionDeclaration,
  ParameterDeclaration,
  Type,
  Symbol,
  NamespaceDeclaration,
} from "ts-morph"
import { JSType, JSValue } from "../domain/JSValue"
import {
  ModelMap,
  RefMap,
  RPCFunction,
  RPCFunctionParameter,
  SamenManifest,
} from "../domain/manifest"
import {
  ManifestCompilerError,
  PropertiesMissingError,
  PropertyMissingError,
  UnsupportedTypeError,
} from "../errors"

export default function generateManifest(
  samenSourceFile: SourceFile,
  typeChecker: TypeChecker,
): SamenManifest {
  try {
    const manifest: SamenManifest = {
      rpcFunctions: [],
      models: {},
      refs: {},
    }

    for (const [namespace, functions] of getFunctionsPerNamespace(
      samenSourceFile,
    ).entries()) {
      compileRPCs(typeChecker, manifest, namespace, functions)
    }

    return manifest
  } catch (error) {
    throw new ManifestCompilerError(error)
  }
}

type NamespaceFunctionMap = Map<string[], FunctionDeclaration[]>

function getFunctionsPerNamespace(
  samenSourceFile: SourceFile,
): NamespaceFunctionMap {
  const result: NamespaceFunctionMap = new Map<
    string[],
    FunctionDeclaration[]
  >()

  result.set([], reduceFuncs(samenSourceFile.getExportSymbols()))

  const namespaces = samenSourceFile.getNamespaces().map((namespaceDeclr) => {
    const namespaceSegments = namespaceDeclr
      .getNameNodes()
      .map((nn) => nn.getSymbolOrThrow().getName())
    return namespaceSegments
  })

  for (const namespace of namespaces) {
    const namespaceString = namespace.join(".")
    const topLevelNamespace = samenSourceFile.getNamespace(namespaceString)

    const namespaceSymbols = namespace
      .slice(1)
      .reduce((result: Symbol[], namespaceSegment: string) => {
        return result
          .filter((s) => s.getName() == namespaceSegment)
          .flatMap((s) =>
            (s.getValueDeclaration() as NamespaceDeclaration)?.getExportSymbols(),
          )
      }, topLevelNamespace?.getExportSymbols() ?? [])

    result.set(namespace, reduceFuncs(namespaceSymbols))
  }

  return result

  function reduceFuncs(symbols: Symbol[]): FunctionDeclaration[] {
    return symbols.reduce(
      (result: FunctionDeclaration[], exportSymbol: Symbol) => {
        const symbol = exportSymbol.isAlias()
          ? exportSymbol.getAliasedSymbolOrThrow()
          : exportSymbol

        const valueDeclr = symbol.getValueDeclaration()

        if (valueDeclr === undefined) {
          return result
        }

        if (Node.isFunctionDeclaration(valueDeclr)) {
          return [...result, valueDeclr]
        }
        if (Node.isVariableDeclaration(valueDeclr)) {
          const exportedVariable = valueDeclr
            .getInitializer()
            ?.getType()
            ?.getSymbol()
            ?.getValueDeclaration()
          if (Node.isFunctionDeclaration(exportedVariable)) {
            return [...result, exportedVariable]
          }
        }
        return result
      },
      [] as FunctionDeclaration[],
    )
  }
}

function compileRPCs(
  typeChecker: TypeChecker,
  manifest: SamenManifest,
  namespace: string[],
  functionDeclarations: FunctionDeclaration[],
) {
  for (const functionDeclaration of functionDeclarations) {
    const returnType = functionDeclaration.getReturnType()
    const isReturnTypePromise = returnType.getSymbol()?.getName() === "Promise"
    const useReturnType = isReturnTypePromise
      ? returnType.getTypeArguments()[0]
      : returnType

    const modelIds: string[] = []
    const newModels = extractModels(functionDeclaration, manifest.models)

    for (const model of Object.values(newModels)) {
      if (manifest.models[model.id] === undefined) {
        manifest.models[model.id] = model
      }
      modelIds.push(model.id)
    }

    const name = functionDeclaration.getName()

    if (!name) {
      throw new Error("Function has no name")
    }

    const rpcFunction: RPCFunction = {
      name,
      parameters: functionDeclaration
        .getParameters()
        .map((param, index) =>
          compileParameterDeclaration(param, index, typeChecker, manifest.refs),
        ),
      returnType: getJSValue(
        useReturnType,
        typeChecker,
        manifest.refs,
        functionDeclaration,
      ),
      modelIds,
      namespace,
    }

    manifest.rpcFunctions.push(rpcFunction)
  }
}

function compileParameterDeclaration(
  param: ParameterDeclaration,
  paramIndex: number,
  typeChecker: TypeChecker,
  refValues: RefMap,
): RPCFunctionParameter {
  return {
    index: paramIndex,
    name: param.getName(),
    value: getJSValue(param.getType(), typeChecker, refValues, param),
  }
}

function getJSValue(
  type: Type,
  typeChecker: TypeChecker,
  refValues: RefMap,
  location: Node<ts.Node>,
): JSValue {
  if (type.getFlags() & ts.TypeFlags.Void) {
    return { type: JSType.untyped }
  }

  if (type.isLiteral()) {
    if (type.isEnumLiteral()) {
      const enumValueDeclration = type
        .getSymbolOrThrow()
        .getValueDeclarationOrThrow()
      if (Node.isEnumMember(enumValueDeclration)) {
        const enumValue = enumValueDeclration.getValue()
        const theEnum = enumValueDeclration.getParent()
        const enumName = `${theEnum.getName()}.${enumValueDeclration.getName()}`
        const jsValue: JSValue =
          typeof enumValue === "string"
            ? { type: JSType.string, oneOf: [enumValue] }
            : typeof enumValue === "number"
            ? { type: JSType.number, oneOf: [enumValue] }
            : { type: JSType.undefined }

        refValues[enumName] = {
          id: enumName,
          modelId: enumName,
          value: jsValue,
        }
        return { type: JSType.ref, id: enumName }
      }
    }
    if (type.isStringLiteral()) {
      return {
        type: JSType.string,
        oneOf: [type.getText().substring(1, type.getText().length - 1)],
      }
    }
    if (type.isNumberLiteral()) {
      return { type: JSType.number, oneOf: [parseInt(type.getText())] }
    }
    if (type.isBooleanLiteral()) {
      return { type: JSType.boolean, oneOf: [type.getText() === "true"] }
    }
  }

  if (type.isAny() || type.isUnknown()) {
    return { type: JSType.untyped }
  }
  if (type.isNumber()) {
    return { type: JSType.number }
  }
  if (type.isString()) {
    return { type: JSType.string }
  }
  if (type.isBoolean()) {
    return { type: JSType.boolean }
  }
  if (type.isUndefined()) {
    return { type: JSType.undefined }
  }
  if (type.isNull()) {
    return { type: JSType.null }
  }
  if (type.isTuple()) {
    return {
      type: JSType.tuple,
      elementTypes: type
        .getTupleElements()
        .map((tt) => getJSValue(tt, typeChecker, refValues, location)),
    }
  }
  if (type.isArray()) {
    return {
      type: JSType.array,
      elementType: getJSValue(
        type.getArrayElementTypeOrThrow(),
        typeChecker,
        refValues,
        location,
      ),
    }
  }
  if (type.isObject() || type.isIntersection()) {
    if ((type.getAliasSymbol() ?? type.getSymbol())?.getName() === "Date") {
      return { type: JSType.date }
    }

    const getJsObjectValue = (): JSValue => {
      return {
        type: JSType.object,
        properties: type.getProperties().map((paramSymbol) => {
          const concreteType = typeChecker.getTypeOfSymbolAtLocation(
            paramSymbol,
            paramSymbol.getValueDeclarationOrThrow(),
          )

          return {
            name: paramSymbol.getName(),
            ...getJSValue(concreteType, typeChecker, refValues, location),
          }
        }),
      }
    }

    const symbol = getInterestingSymbol(type)

    if (!symbol) {
      return getJsObjectValue()
    }

    const symbolName = cleanSymbolName(type.getText())
    const modelNode: Node<ts.Node> = symbol.getDeclarations()[0]
    const modelId: string | undefined = cleanModelId(
      modelNode.getSymbolOrThrow().getFullyQualifiedName(),
    )

    if (!modelId) {
      throw new PropertiesMissingError(["modelId"])
    }

    if (!refValues[symbolName]) {
      refValues[symbolName] = {
        id: symbolName,
        modelId,
        value: { type: JSType.undefined },
      }
      refValues[symbolName].value = getJsObjectValue()
    }

    return {
      type: JSType.ref,
      id: symbolName,
    }
  }

  if (type.isUnion()) {
    if (type.isEnum()) {
      const enumDeclr = type.getSymbolOrThrow().getValueDeclarationOrThrow()
      if (Node.isEnumDeclaration(enumDeclr)) {
        const enumName = enumDeclr.getName()
        const allEnumValues = enumDeclr.getMembers().map((m) => m.getValue())
        const jsValue: JSValue =
          allEnumValues.length && typeof allEnumValues[0] === "string"
            ? { type: JSType.string, oneOf: allEnumValues as string[] }
            : allEnumValues.length && typeof allEnumValues[0] === "number"
            ? { type: JSType.number, oneOf: allEnumValues as number[] }
            : { type: JSType.undefined }

        refValues[enumName] = {
          id: enumName,
          modelId: enumName,
          value: jsValue,
        }

        return {
          type: JSType.ref,
          id: enumName,
        }
      }
    }

    const unionTypes = type
      .getUnionTypes()
      .map((ut) => getJSValue(ut, typeChecker, refValues, location))
    const mergedUnionTypes = mergeUnionTypes(unionTypes)
    if (mergedUnionTypes.length === 1) {
      return mergedUnionTypes[0]
    }
    return {
      type: JSType.oneOfTypes,
      oneOfTypes: mergedUnionTypes,
    }
  }

  throw new UnsupportedTypeError(type)
}

function cleanModelId(modelId: string): string | undefined {
  return modelId.match(/(^"[^"]+"\.)?(.+)/)?.[2]
}

function cleanSymbolName(symbolName: string): string {
  return symbolName.replace(/(import\([^)]+\)\.)/g, "")
}

function mergeUnionTypes(jsValues: JSValue[]): JSValue[] {
  const oneOfTypes: JSValue[] = []
  const strings: string[] = []
  const numbers: number[] = []
  const booleans: boolean[] = []

  for (const unionType of jsValues) {
    if (unionType.type === JSType.string && unionType.oneOf) {
      for (const str of unionType.oneOf) {
        strings.push(str)
      }
    } else if (unionType.type === JSType.number && unionType.oneOf) {
      for (const nbr of unionType.oneOf) {
        numbers.push(nbr)
      }
    } else if (unionType.type === JSType.boolean && unionType.oneOf) {
      for (const bool of unionType.oneOf) {
        booleans.push(bool)
      }
    } else {
      oneOfTypes.push(unionType)
    }
  }
  if (strings.length) {
    oneOfTypes.push({ type: JSType.string, oneOf: strings })
  }
  if (numbers.length) {
    oneOfTypes.push({ type: JSType.number, oneOf: numbers })
  }
  if (booleans.length) {
    oneOfTypes.push(
      booleans.length === 2
        ? { type: JSType.boolean }
        : { type: JSType.boolean, oneOf: booleans },
    )
  }
  return oneOfTypes
}

function extractModels(func: FunctionDeclaration, models: ModelMap): ModelMap {
  return loop([
    ...func.getParameters().map((p) => p.getType()),
    func.getReturnType(),
  ])

  function loop(todos: Type[], done: Type[] = []): ModelMap {
    if (todos.length === 0) {
      return models
    }

    const [type, ...otherTodos] = todos

    const symbol = getInterestingSymbol(type)

    if (symbol) {
      const node = symbol.getDeclarations()[0]

      const modelAsText = node.getFullText().trim()
      const modelId = cleanModelId(
        node.getSymbolOrThrow().getFullyQualifiedName(),
      )
      const modelName = node.getSymbolOrThrow().getName()

      if (!modelId) {
        throw new PropertyMissingError("modelId")
      }

      if (models[modelId] === undefined) {
        models[modelId] = {
          id: modelId,
          name: modelName,
          namespace: modelId.includes(".")
            ? modelId.replace(new RegExp(`\\.${modelName}$`), "").split(".")
            : [],
          ts: modelAsText,
        }
      }
    }

    const arrayElement = type.getArrayElementType()

    const theEnum =
      type.isEnumLiteral() &&
      type
        .getSymbolOrThrow()
        .getValueDeclarationOrThrow()
        .getParent()
        ?.getType()

    const possibleTypes = [
      ...(theEnum ? [theEnum] : []),
      ...type.getBaseTypes(),
      ...type.getTypeArguments(),
      ...type.getAliasTypeArguments(),
      ...type.getTupleElements(),
      ...(arrayElement ? [arrayElement] : []),
      ...type.getIntersectionTypes(),
      ...type.getUnionTypes(),
      ...(type.isObject() && !type.isTuple()
        ? type.getProperties().map((ps) => {
            return ps.getValueDeclarationOrThrow().getType()
          })
        : []),
    ]

    const newTodos = [
      ...otherTodos,
      ...possibleTypes.filter((pt) => !done.includes(pt)),
    ]

    const newDone = [...done, type]

    return loop(newTodos, newDone)
  }
}

function getInterestingSymbol(type: Type<ts.Type>): Symbol | undefined {
  let symbol: Symbol
  const defaultSymbol = type.getSymbol()
  const aliasSymbol = type.getAliasSymbol()

  if (!type.isAnonymous() && defaultSymbol) {
    symbol = defaultSymbol
  } else if (aliasSymbol) {
    symbol = aliasSymbol
  } else {
    return
  }

  if (type.isEnumLiteral() || type.isTypeParameter()) {
    return
  }
  if (["Promise", "Date", "Array"].includes(symbol.getName())) {
    return
  }

  return symbol
}
