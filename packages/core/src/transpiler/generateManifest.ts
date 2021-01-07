import path from "path"
import {
  ts,
  SourceFile,
  TypeChecker,
  Node,
  FunctionDeclaration,
  ParameterDeclaration,
  Type,
  Symbol,
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
import * as paths from "../paths"

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

    for (const exportSymbol of samenSourceFile.getExportSymbols()) {
      const symbol = exportSymbol.isAlias()
        ? exportSymbol.getAliasedSymbolOrThrow()
        : exportSymbol
      if (symbol.getFlags() & ts.SymbolFlags.Function) {
        const functionDeclaration = symbol.getValueDeclarationOrThrow() as FunctionDeclaration

        const returnType = functionDeclaration.getReturnType()
        const isReturnTypePromise =
          returnType.getSymbol()?.getName() === "Promise"
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

        const name = symbol.getName()
        const rpcFunction: RPCFunction = {
          name,
          parameters: functionDeclaration
            .getParameters()
            .map((param, index) =>
              compileParameterDeclaration(
                param,
                index,
                typeChecker,
                manifest.refs,
              ),
            ),
          returnType: getJSValue(
            useReturnType,
            typeChecker,
            manifest.refs,
            functionDeclaration,
          ),
          modelIds,
          filePath: {
            sourceFile: path.relative(
              paths.userProjectDir,
              functionDeclaration.getSourceFile().getFilePath(),
            ),
            outputFile: path.relative(
              paths.userProjectDir,
              samenSourceFile.getEmitOutput().getOutputFiles()[0].getFilePath(),
            ),
          },
        }

        manifest.rpcFunctions.push(rpcFunction)
      }
    }

    return manifest
  } catch (error) {
    throw new ManifestCompilerError(error)
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
        const enumName = theEnum.getName()
        const allEnumValues = theEnum.getMembers().map((m) => m.getValue())

        if (typeof enumValue === "string") {
          refValues[enumName] = {
            id: enumName,
            modelId: enumName,
            value: { type: JSType.string, oneOf: allEnumValues as string[] },
          }
          return { type: JSType.string, oneOf: [enumValue] }
        }
        if (typeof enumValue === "number") {
          refValues[enumName] = {
            id: enumName,
            modelId: enumName,
            value: { type: JSType.number, oneOf: allEnumValues as number[] },
          }
          return { type: JSType.number, oneOf: [enumValue] }
        }
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

    const symbolName: string | undefined = cleanSymbolName(type.getText())
    const modelNode: Node<ts.Node> = symbol.getDeclarations()[0]
    const modelId: string | undefined = cleanModelId(
      modelNode.getSymbolOrThrow().getFullyQualifiedName(),
    )

    if (!modelId || !symbolName) {
      throw new PropertiesMissingError(["modelId", "symbolName"])
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

function cleanSymbolName(symbolName: string): string | undefined {
  return symbolName.match(/(^import\([^)]+\)\.)?(.+)/)?.[2]
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

      if (!modelId) {
        throw new PropertyMissingError("modelId")
      }

      if (models[modelId] === undefined) {
        models[modelId] = {
          id: modelId,
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
