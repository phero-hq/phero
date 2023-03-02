import ts from "typescript"
import { DependencyMap, TypeParamMap, InternalParserModelMap } from ".."
import {
  MemberParserModel,
  IndexMemberParserModel,
  ParserModelType,
  ParserModel,
} from "../../domain/ParserModel"
import generateFromTypeReferenceNode from "../generateFromTypeNode/generateFromTypeReferenceNode"
import generateFromTypeElementDeclaration from "./generateFromTypeElementDeclaration"

export default function generateFromInterfaceDeclaration(
  interfaceDeclr: ts.InterfaceDeclaration,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const memberParsers = interfaceDeclr.members.reduce<{
    models: (MemberParserModel | IndexMemberParserModel)[]
    deps: DependencyMap
  }>(
    ({ models, deps }, member) => {
      // console.group(
      //   "getObjectParserModelFromDeclaration",
      //   interfaceDeclr.name.text,
      // )
      const memberModel = generateFromTypeElementDeclaration(
        member,
        type,
        location,
        typeChecker,
        deps,
        typeParams,
      )
      // console.groupEnd()
      return {
        models: [...models, memberModel.root],
        deps: memberModel.deps,
      }
    },
    { models: [], deps },
  )

  const selfModel = {
    type: ParserModelType.Object,
    members: memberParsers.models,
  } as const

  const inheritedTypes: ts.ExpressionWithTypeArguments[] | undefined =
    interfaceDeclr.heritageClauses
      ?.filter((base) => {
        return base.token === ts.SyntaxKind.ExtendsKeyword
      })
      .flatMap((extendClause) => extendClause.types)

  if (!inheritedTypes) {
    return {
      root: selfModel,
      deps: memberParsers.deps,
    }
  }

  const inheritedParsers = inheritedTypes.reduce<{
    models: ParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, inheritedType) => {
      const inheritedTypeModel = generateFromTypeReferenceNode(
        inheritedType,
        type,
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        models: [...models, inheritedTypeModel.root],
        deps: inheritedTypeModel.deps,
      }
    },
    { models: [], deps: memberParsers.deps },
  )

  return {
    root: {
      type: ParserModelType.Intersection,
      parsers: [selfModel, ...inheritedParsers.models],
    },
    deps: inheritedParsers.deps,
  }
}
