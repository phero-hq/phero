import type ts from "typescript"
import generateFromTypeNode from "."
import {
  type DependencyMap,
  type InternalParserModelMap,
  type TypeParamMap,
} from ".."
import { type ParserModel, ParserModelType } from "../../domain/ParserModel"

export default function generateFromUnionTypeNode(
  typeNode: ts.UnionTypeNode,
  type: ts.UnionType,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const subtypeModels = typeNode.types.reduce<{
    oneOf: ParserModel[]
    deps: DependencyMap
  }>(
    ({ oneOf, deps }, subtype, index) => {
      const subtypeModel = generateFromTypeNode(
        subtype,
        typeChecker.getTypeAtLocation(subtype),
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        oneOf: [...oneOf, subtypeModel.root],
        deps: subtypeModel.deps,
      }
    },
    { oneOf: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Union,
      oneOf: subtypeModels.oneOf,
    },
    deps: subtypeModels.deps,
  }
}
