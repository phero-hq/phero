import ts from "typescript"
import { DependencyMap, TypeParamMap, InternalParserModelMap } from ".."
import { ParseError } from "../../../domain/errors"
import { printCode } from "../../../lib/tsTestUtils"
import {
  ParserModel,
  ParserModelType,
  ReferenceParserModel,
} from "../../ParserModel"
import generateFromType from "../generateFromType"
import generateFromTypeNode from "../generateFromTypeNode"
import propertyNameAsString from "../lib/propertyNameAsString"
import generateFromEnumDeclaration from "./generateFromEnumDeclaration"
import generateFromEnumMemberDeclaration from "./generateFromEnumMemberDeclaration"
import generateFromInterfaceDeclaration from "./generateFromInterfaceDeclaration"

export default function generateFromDeclaration(
  typeNode: ts.TypeReferenceType,
  declaration: ts.Declaration,
  type: ts.Type,
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
        type as ts.TypeReference,
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
      (updatedDeps) =>
        generateFromInterfaceDeclaration(
          declaration,
          type as ts.TypeReference,
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
        type as ts.TypeReference,
        typeChecker,
        typeParams,
        deps,
      )

    if (ts.isMappedTypeNode(declaration.type)) {
      return generateFromType(
        type,
        declaration.type,
        location,
        typeChecker,
        updatedDeps,
        updatedTypeParams,
      )
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
        generateFromTypeNode(
          declaration.type,
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

  throw new ParseError(
    `Reference to type with kind ${
      ts.tokenToString(declaration.kind) ?? declaration.kind.toString()
    } not supported`,
    typeNode,
  )
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
  if (!declaration.typeParameters || declaration.typeParameters.length === 0) {
    return { typeParams, deps }
  }

  console.group("getUpdatedTypeParams", printCode(typeNode))

  const typeArgumentTypes: readonly ts.Type[] =
    type.aliasTypeArguments ?? typeChecker.getTypeArguments(type)
  const typeArguments = typeNode.typeArguments ?? []

  let depsMap: DependencyMap = deps

  for (let i = 0; i < declaration.typeParameters.length; i++) {
    const typeParam = declaration.typeParameters[i]
    const typeArgument = typeArguments[i]
    const typeArgumentType = typeArgumentTypes[i]

    if (typeArgumentType) {
      const typeArgModel = generateFromType(
        typeArgumentType,
        typeNode,
        location,
        typeChecker,
        depsMap,
        typeParams,
      )
      typeParams.set(typeParam.name.text, {
        name: typeChecker.typeToString(typeArgumentType),
        model: typeArgModel.root,
      })
      depsMap = typeArgModel.deps
    } else if (typeArgument) {
      const inferedTypeArgumentType =
        typeChecker.getTypeAtLocation(typeArgument)
      if (inferedTypeArgumentType.isTypeParameter()) {
        typeParams.set(
          typeParam.name.text,
          getTypeParamParserModel(typeNode, typeParam, typeParams),
        )
      } else {
        // Werkt voor test "MyMappedType keyof as default parameter"
        const typeArgModel = generateFromTypeNode(
          typeArgument,
          inferedTypeArgumentType,
          location,
          typeChecker,
          deps,
          typeParams,
        )
        typeParams.set(typeParam.name.text, {
          name: typeChecker.typeToString(inferedTypeArgumentType),
          model: typeArgModel.root,
        })
        depsMap = typeArgModel.deps

        // Werkt voor test "MyMappedType = Omit"
        // behalve dat de typeParameters niet kloppen

        // const x = generateFromType(
        //   type,
        //   typeNode,
        //   location,
        //   typeChecker,
        //   deps,
        //   typeParams,
        // )

        // typeParams.set(typeParam.name.text, {
        //   name: typeChecker.typeToString(inferedTypeArgumentType),
        //   // model: typeArgModel.root,
        //   model: x.root,
        // })

        // depsMap = x.deps
      }
    } else if (typeParam.default) {
      // const typeArgModel = generateFromTypeNode(
      //   typeParam.default,
      //   type,
      //   location,
      //   typeChecker,
      //   deps,
      //   typeParams,
      // )
      // typeParams.set(typeParam.name.text, {
      //   name: typeParam.name.text,
      //   model: typeArgModel.root,
      // })
      // depsMap = typeArgModel.deps

      const x = generateFromType(
        type,
        typeNode,
        location,
        typeChecker,
        deps,
        typeParams,
      )

      typeParams.set(typeParam.name.text, {
        name: typeChecker.typeToString(type),
        model: x.root,
      })

      depsMap = x.deps
    } else {
      throw new ParseError(
        "Type parameter has no default or is is it parameterised",
        typeParam,
      )
    }
  }

  const r = { typeParams, deps: depsMap }

  console.groupEnd()
  return r
}

function generateReferenceParserModelForDeclaration(
  typeNode: ts.TypeReferenceType,
  declaration: ts.Declaration,
  typeParams: TypeParamMap,
): ReferenceParserModel {
  if (
    (!ts.isInterfaceDeclaration(declaration) &&
      !ts.isTypeAliasDeclaration(declaration)) ||
    !declaration.typeParameters ||
    declaration.typeParameters.length === 0
  ) {
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
      throw new ParseError("Expression not supported", typeNode.expression)
    }
    return entityNameAsString(typeNode.expression)
  }

  return entityNameAsString(typeNode.typeName)

  function entityNameAsString(typeName: ts.EntityName): string {
    if (ts.isIdentifier(typeName)) {
      return typeName.text
    }
    return `${entityNameAsString(typeName.left)}.${typeName.right.text}`
  }
}

function getTypeParamParserModel(
  typeNode: ts.TypeNode,
  declaration: ts.TypeParameterDeclaration,
  typeParams: TypeParamMap,
): { name: string; model: ParserModel } {
  const typeParamModel = typeParams.get(declaration.name.text)
  if (!typeParamModel) {
    throw new ParseError(
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
  const depsWithCircuitBreaker = new Map([...deps, [ref.typeName, ref]])

  const { root, deps: updatedDeps } = generateDependencyParserModel(
    depsWithCircuitBreaker,
  )

  return new Map([
    ...updatedDeps,
    [
      ref.typeName,
      ref.typeArguments
        ? {
            type: ParserModelType.Generic,
            typeName: ref.typeName,
            typeArguments: ref.typeArguments,
            parser: root,
          }
        : root,
    ],
  ])
}
