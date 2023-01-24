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
    const updatedDeps: DependencyMap = deps.has(declaration.name.text)
      ? deps
      : new Map([
          ...deps,
          [
            declaration.name.text,
            {
              name: declaration.name.text,
              model: generateFromEnumDeclaration(declaration, typeChecker),
            },
          ],
        ])

    return {
      root: {
        type: ParserModelType.Reference,
        typeName: declaration.name.text,
      },
      deps: updatedDeps,
    }
  }

  if (ts.isEnumMember(declaration)) {
    const typeName = `${declaration.parent.name.text}.${propertyNameAsString(
      declaration.name,
    )}`

    const updatedDeps = deps.has(typeName)
      ? deps
      : new Map([
          ...deps,
          [
            typeName,
            {
              name: typeName,
              model: generateFromEnumMemberDeclaration(
                declaration,
                typeChecker,
              ),
            },
          ],
        ])

    return {
      root: {
        type: ParserModelType.Reference,
        typeName,
      },
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

    if (deps.has(ref.typeName)) {
      return { root: ref, deps: updatedDeps }
    }

    const updatedDeps2: DependencyMap = deps.has(declaration.name.text)
      ? updatedDeps
      : new Map([
          ...updatedDeps,
          [
            ref.typeName,
            {
              name: ref.typeName,
              model: ref,
            },
          ],
        ])

    const result = generateFromInterfaceDeclaration(
      declaration,
      type as ts.TypeReference,
      location,
      typeChecker,
      updatedDeps2,
      updatedTypeParams,
    )

    return {
      root: ref,
      deps: new Map([
        ...result.deps,
        [
          ref.typeName,
          ref.typeArguments
            ? {
                name: ref.typeName,
                model: {
                  type: ParserModelType.Generic,
                  typeName: ref.typeName,
                  typeArguments: ref.typeArguments,
                  parser: result.root,
                },
              }
            : {
                name: ref.typeName,
                model: result.root,
              },
        ],
      ]),
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
      console.log("JAAAAA", declaration.name.text)
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

    if (deps.has(ref.typeName)) {
      return { root: ref, deps: updatedDeps }
    }

    const updatedDeps2: DependencyMap = deps.has(declaration.name.text)
      ? updatedDeps
      : new Map([
          ...updatedDeps,
          [
            ref.typeName,
            {
              name: ref.typeName,
              model: ref,
            },
          ],
        ])

    const result = generateFromTypeNode(
      declaration.type,
      type,
      location,
      typeChecker,
      updatedDeps2,
      updatedTypeParams,
    )

    return {
      root: ref,
      deps: new Map([
        ...result.deps,
        [
          ref.typeName,
          ref.typeArguments
            ? {
                name: ref.typeName,
                model: {
                  type: ParserModelType.Generic,
                  typeName: ref.typeName,
                  typeArguments: ref.typeArguments,
                  parser: result.root,
                },
              }
            : {
                name: ref.typeName,
                model: result.root,
              },
        ],
      ]),
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

  console.log(
    "getUpdatedTypeParams COUNT",
    typeArguments.length,
    declaration.typeParameters.length,
  )

  let depsMap: DependencyMap = deps

  for (let i = 0; i < declaration.typeParameters.length; i++) {
    const typeParam = declaration.typeParameters[i]
    const typeArgument = typeArguments[i]
    const typeArgumentType = typeArgumentTypes[i]

    if (typeArgumentType) {
      console.log("ABC", 1)
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
      console.log("ABC", 2)
      const inferedTypeArgumentType =
        typeChecker.getTypeAtLocation(typeArgument)
      if (inferedTypeArgumentType.isTypeParameter()) {
        console.log("ABC", 21)
        typeParams.set(
          typeParam.name.text,
          getTypeParamParserModel(typeNode, typeParam, typeParams),
        )
      } else {
        console.log("ABC", 22)
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
      console.log("x.deps BEFORE", deps.keys())
      console.log("x.deps AFTER", x.deps.keys())
      depsMap = x.deps
    } else {
      console.log("ABC", 4)
      console.log("typeArgument", typeArgument)
      console.log("typeArgumentType", typeArgumentType)
      throw new ParseError(
        "Type parameter has no default or is is it parameterised",
        typeParam,
      )
    }
  }

  const r = { typeParams, deps: depsMap }
  console.log(
    "getUpdatedTypeParams RESULT 2",
    console.log(JSON.stringify(depsMap, null, 4)),
  )
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
