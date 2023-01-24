import ts from "typescript"
import generateFromTypeNode from "."
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParseError } from "../../../domain/errors"
import { printCode } from "../../../lib/tsTestUtils"
import {
  ParserModel,
  ParserModelType,
  ReferenceParserModel,
} from "../../ParserModel"
import generateFromDeclaration from "../generateFromDeclaration"
import generateFromType from "../generateFromType"

export default function generateFromTypeReferenceNode(
  typeNode: ts.TypeReferenceType,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const declaration = getDeclaration(typeNode, typeChecker)

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

  if (ts.isTypeAliasDeclaration(declaration)) {
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
  }

  const ref = generateReferenceParserModelForDeclaration(
    typeNode,
    declaration,
    updatedTypeParams,
  )

  if (updatedDeps.has(ref.typeName)) {
    return {
      root: ref,
      deps: updatedDeps,
    }
  }

  const depModel = generateFromDeclaration(
    typeNode,
    declaration,
    type,
    location,
    typeChecker,
    new Map([
      ...updatedDeps,
      // short circuit for recursive reference types
      [
        ref.typeName,
        {
          name: `TODO`,
          model: ref,
        },
      ],
    ]),
    updatedTypeParams,
  )

  return {
    root: ref,
    deps: new Map([
      ...depModel.deps,
      [
        ref.typeName,
        ref.typeArguments
          ? {
              name: ref.typeName,
              model: {
                type: ParserModelType.Generic,
                typeName: ref.typeName,
                typeArguments: ref.typeArguments,
                parser: depModel.root,
              },
            }
          : {
              name: ref.typeName,
              model: depModel.root,
            },
      ],
    ]),
  }
}

function getDeclaration(
  typeNode: ts.TypeReferenceType,
  typeChecker: ts.TypeChecker,
): ts.Declaration {
  const symbol = typeChecker.getSymbolAtLocation(
    ts.isTypeReferenceNode(typeNode) ? typeNode.typeName : typeNode.expression,
  )
  if (!symbol) {
    throw new ParseError("Entity must have symbol", typeNode)
  }

  const declaration = symbol?.declarations?.[0]
  if (!declaration) {
    throw new ParseError("Entity must have declaration", typeNode)
  }

  return declaration
}

function getUpdatedTypeParams(
  typeNode: ts.TypeReferenceType,
  location: ts.TypeNode,
  declaration: ts.Declaration,
  type: ts.TypeReference,
  typeChecker: ts.TypeChecker,
  typeParams: TypeParamMap,
  deps: DependencyMap,
): { typeParams: TypeParamMap; deps: DependencyMap } {
  if (
    (!ts.isInterfaceDeclaration(declaration) &&
      !ts.isTypeAliasDeclaration(declaration)) ||
    !declaration.typeParameters ||
    declaration.typeParameters.length === 0
  ) {
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
