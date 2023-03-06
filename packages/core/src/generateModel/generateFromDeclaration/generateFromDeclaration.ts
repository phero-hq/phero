import ts from "typescript"
import {
  type DependencyMap,
  type InternalParserModelMap,
  type TypeParamMap,
} from ".."
import { PheroParseError } from "../../domain/errors"
import {
  type ParserModel,
  ParserModelType,
  type ReferenceParserModel,
} from "../../domain/ParserModel"
import generateFromType from "../generateFromType"
import generateFromTypeNode from "../generateFromTypeNode"
import propertyNameAsString from "../lib/propertyNameAsString"
import generateFromEnumDeclaration from "./generateFromEnumDeclaration"
import generateFromEnumMemberDeclaration from "./generateFromEnumMemberDeclaration"
import generateFromInterfaceDeclaration from "./generateFromInterfaceDeclaration"

export default function generateFromDeclaration(
  typeNode: ts.TypeReferenceType,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  return generateFromDeclarationWithDeclaration(
    getDeclaration(typeNode, typeChecker),
    typeNode,
    type,
    location,
    typeChecker,
    deps,
    typeParams,
  )
}

function generateFromDeclarationWithDeclaration(
  declaration: ts.Declaration,
  typeNode: ts.TypeReferenceType,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (ts.isTypeParameterDeclaration(declaration)) {
    const typeParserModel = getTypeParamParserModel(
      typeNode,
      declaration,
      typeParams,
    )
    return {
      root: typeParserModel.model,
      deps,
    }
  }

  if (ts.isEnumDeclaration(declaration)) {
    const reference: ReferenceParserModel = {
      type: ParserModelType.Reference,
      typeName: declaration.name.text,
    }

    const updatedDeps = lazilyGenerateDependency(deps, reference, () => ({
      root: generateFromEnumDeclaration(declaration, typeChecker),
      deps,
    }))

    return {
      root: reference,
      deps: updatedDeps,
    }
  }

  if (ts.isEnumMember(declaration)) {
    const reference: ReferenceParserModel = {
      type: ParserModelType.Reference,
      typeName: `${declaration.parent.name.text}.${propertyNameAsString(
        declaration.name,
      )}`,
    }

    const updatedDeps = lazilyGenerateDependency(deps, reference, () => ({
      root: generateFromEnumMemberDeclaration(declaration, typeChecker),
      deps,
    }))

    return {
      root: reference,
      deps: updatedDeps,
    }
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    const { typeParams: updatedTypeParams, deps: updatedDeps } =
      getUpdatedTypeParams(
        typeNode,
        location,
        declaration,
        type,
        typeChecker,
        typeParams,
        deps,
      )

    if (
      declaration.name.text === "Date" &&
      declaration.getSourceFile().fileName.endsWith("lib.es5.d.ts")
    ) {
      return { root: { type: ParserModelType.Date }, deps }
    }

    if (
      (declaration.name.text === "Array" &&
        typeNode.typeArguments?.length === 1,
      declaration.getSourceFile().fileName.endsWith("lib.es5.d.ts"))
    ) {
      const arrayElementTypeNode = typeNode.typeArguments?.[0]
      const arrayElementType =
        arrayElementTypeNode &&
        typeChecker.getTypeAtLocation(arrayElementTypeNode)

      if (!arrayElementTypeNode || !arrayElementType) {
        throw new PheroParseError("Array should have a type", typeNode)
      }

      const elementModel = generateFromTypeNode(
        arrayElementTypeNode,
        arrayElementType,
        location,
        typeChecker,
        deps,
        typeParams,
      )

      return {
        root: {
          type: ParserModelType.Array,
          element: {
            type: ParserModelType.ArrayElement,
            parser: elementModel.root,
          },
        },
        deps: elementModel.deps,
      }
    }

    const ref = generateReferenceParserModelForDeclaration(
      typeNode,
      declaration,
      updatedTypeParams,
    )

    const updatedDeps2 = lazilyGenerateDependency(
      updatedDeps,
      ref,
      (updatedDeps) =>
        generateFromInterfaceDeclaration(
          declaration,
          type,
          location,
          typeChecker,
          updatedDeps,
          updatedTypeParams,
        ),
    )

    return {
      root: ref,
      deps: updatedDeps2,
    }
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    const { typeParams: updatedTypeParams, deps: updatedDeps } =
      getUpdatedTypeParams(
        typeNode,
        location,
        declaration,
        type,
        typeChecker,
        typeParams,
        deps,
      )

    const ref = generateReferenceParserModelForDeclaration(
      typeNode,
      declaration,
      updatedTypeParams,
    )

    const updatedDeps2 = lazilyGenerateDependency(
      updatedDeps,
      ref,
      (updatedDeps) => {
        return isEventuallyMappedOrConditionalTypeNode(
          declaration.type,
          typeChecker,
        )
          ? generateFromType(
              type,
              declaration.type,
              location,
              typeChecker,
              updatedDeps,
              updatedTypeParams,
            )
          : generateFromTypeNode(
              declaration.type,
              type,
              location,
              typeChecker,
              updatedDeps,
              updatedTypeParams,
            )
      },
    )

    return {
      root: ref,
      deps: updatedDeps2,
    }
  }

  if (ts.isImportSpecifier(declaration)) {
    const symbol = typeChecker.getSymbolAtLocation(declaration.name)
    if (!symbol) {
      throw new PheroParseError("HUWEWE 1", declaration)
    }

    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
    if (!aliasSymbol.declarations?.[0]) {
      throw new PheroParseError("HUWEWE 2", declaration)
    }

    return generateFromDeclarationWithDeclaration(
      aliasSymbol.declarations?.[0],
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  if (ts.isClassDeclaration(declaration)) {
    throw new PheroParseError(
      `References to class types are not supported`,
      typeNode,
    )
  }

  throw new PheroParseError(
    `Reference to type with kind ${
      ts.tokenToString(declaration.kind) ?? declaration.kind.toString()
    } not supported`,
    typeNode,
  )
}

function getDeclaration(
  typeNode: ts.TypeReferenceType,
  typeChecker: ts.TypeChecker,
): ts.Declaration {
  const symbol = typeChecker.getSymbolAtLocation(
    ts.isTypeReferenceNode(typeNode) ? typeNode.typeName : typeNode.expression,
  )
  if (!symbol) {
    throw new PheroParseError("Entity must have symbol", typeNode)
  }

  const declaration = symbol?.declarations?.[0]
  if (!declaration) {
    throw new PheroParseError("Entity must have declaration", typeNode)
  }

  return declaration
}

function getUpdatedTypeParams(
  typeNode: ts.TypeReferenceType,
  location: ts.TypeNode,
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  type: ts.TypeReference,
  typeChecker: ts.TypeChecker,
  typeParams: TypeParamMap,
  deps: DependencyMap,
): { typeParams: TypeParamMap; deps: DependencyMap } {
  const updatedTypeParams = new Map([...typeParams])

  if (!declaration.typeParameters || declaration.typeParameters.length === 0) {
    return { typeParams: updatedTypeParams, deps }
  }

  const typeArgumentTypes: readonly ts.Type[] =
    type.aliasTypeArguments ?? typeChecker.getTypeArguments(type)
  const typeArguments = typeNode.typeArguments ?? []

  for (let i = 0; i < declaration.typeParameters.length; i++) {
    const typeParam = declaration.typeParameters[i]
    const typeArgument = typeArguments[i]

    // type parameter has an argument
    if (typeArgument) {
      const typeArgumentType =
        typeArgumentTypes[i] ?? typeChecker.getTypeAtLocation(typeArgument)

      // argument refers to another type parameter
      if (typeArgumentType.isTypeParameter()) {
        const typeParamModel = updatedTypeParams.get(
          typeChecker.typeToString(typeArgumentType),
        )

        if (!typeParamModel) {
          throw new PheroParseError("Type parameter was not defined", typeParam)
        }

        updatedTypeParams.set(typeParam.name.text, typeParamModel)
      } else {
        const typeArgModel = generateFromTypeNode(
          typeArgument,
          typeArgumentType,
          location,
          typeChecker,
          deps,
          updatedTypeParams,
        )

        updatedTypeParams.set(typeParam.name.text, {
          name: typeChecker.typeToString(typeArgumentType),
          model: typeArgModel.root,
        })
        deps = typeArgModel.deps
      }
    }
    // no type argument, fallback to default
    else if (typeParam.default) {
      const typeArgumentType =
        typeArgumentTypes[i] ?? typeChecker.getTypeAtLocation(typeParam.default)

      const typeArgModel = generateFromTypeNode(
        typeParam.default,
        typeArgumentType,
        location,
        typeChecker,
        deps,
        updatedTypeParams,
      )

      updatedTypeParams.set(typeParam.name.text, {
        name: typeChecker.typeToString(typeArgumentType),
        model: typeArgModel.root,
      })
      deps = typeArgModel.deps
    }
  }

  return { typeParams: updatedTypeParams, deps }
}

function generateReferenceParserModelForDeclaration(
  typeNode: ts.TypeReferenceType,
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  typeParams: TypeParamMap,
): ReferenceParserModel {
  if (!declaration.typeParameters || declaration.typeParameters.length === 0) {
    return {
      type: ParserModelType.Reference,
      typeName: generateTypeName(typeNode),
    }
  }

  const typeArgumentModels: Array<{ name: string; model: ParserModel }> = []

  for (let i = 0; i < declaration.typeParameters.length; i++) {
    const typeParam = declaration.typeParameters[i]
    const typeParamModel = getTypeParamParserModel(
      typeNode,
      typeParam,
      typeParams,
    )
    typeArgumentModels.push(typeParamModel)
  }

  return {
    type: ParserModelType.Reference,
    typeName: `${generateTypeName(typeNode)}<${typeArgumentModels
      .map((tam) => tam.name)
      .join(", ")}>`,
    typeArguments: typeArgumentModels.map((tam) => tam.model),
  }
}

function generateTypeName(typeNode: ts.TypeReferenceType): string {
  if (ts.isExpressionWithTypeArguments(typeNode)) {
    if (!ts.isIdentifier(typeNode.expression)) {
      throw new PheroParseError("Expression not supported", typeNode.expression)
    }
    return entityNameAsString(typeNode.expression)
  }

  return entityNameAsString(typeNode.typeName)

  function entityNameAsString(typeName: ts.EntityName): string {
    if (ts.isIdentifier(typeName)) {
      return typeName.text
    }
    return typeName.right.text
  }
}

function getTypeParamParserModel(
  typeNode: ts.TypeNode,
  declaration: ts.TypeParameterDeclaration,
  typeParams: TypeParamMap,
): { name: string; model: ParserModel } {
  const typeParamModel = typeParams.get(declaration.name.text)
  if (!typeParamModel) {
    throw new PheroParseError(
      `No type found for type parameter ${declaration.name.text}`,
      typeNode,
    )
  }
  return typeParamModel
}

function lazilyGenerateDependency(
  deps: DependencyMap,
  ref: ReferenceParserModel,
  generateDependencyParserModel: (
    deps: DependencyMap,
  ) => InternalParserModelMap,
): DependencyMap {
  if (deps.has(ref.typeName)) {
    return deps
  }

  // prevents recursive loops
  const depsWithCircuitBreaker = deps.set(ref.typeName, ref)

  const { root } = generateDependencyParserModel(depsWithCircuitBreaker)

  deps.set(
    ref.typeName,
    ref.typeArguments
      ? {
          type: ParserModelType.Generic,
          typeName: ref.typeName,
          typeArguments: ref.typeArguments,
          parser: root,
        }
      : root,
  )
  return deps
}

function isEventuallyMappedOrConditionalTypeNode(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): boolean {
  if (ts.isMappedTypeNode(node) || ts.isConditionalTypeNode(node)) {
    return true
  }

  if (ts.isTypeAliasDeclaration(node)) {
    return isEventuallyMappedOrConditionalTypeNode(node.type, typeChecker)
  }

  if (ts.isTypeReferenceNode(node)) {
    const d = getDeclaration(node, typeChecker)
    return isEventuallyMappedOrConditionalTypeNode(d, typeChecker)
  }

  return false
}
