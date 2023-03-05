import type ts from "typescript"
import { type DependencyMap, type InternalParserModelMap, type TypeParamMap } from ".."
import {
  type IndexMemberParserModel,
  type MemberParserModel,
  ParserModelType,
} from "../../domain/ParserModel"
import generateFromTypeElementDeclaration from "../generateFromDeclaration/generateFromTypeElementDeclaration"

export default function generateFromTypeLiteralNode(
  typeNode: ts.TypeLiteralNode,
  type: ts.ObjectType,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const memberModels = typeNode.members.reduce<{
    models: (MemberParserModel | IndexMemberParserModel)[]
    deps: DependencyMap
  }>(
    ({ models, deps }, member) => {
      const memberModel = generateFromTypeElementDeclaration(
        member,
        type,
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        models: [...models, memberModel.root],
        deps: memberModel.deps,
      }
    },
    { models: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Object,
      members: memberModels.models,
    },
    deps: memberModels.deps,
  }
}
