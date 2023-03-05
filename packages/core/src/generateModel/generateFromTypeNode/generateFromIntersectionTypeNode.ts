import type ts from "typescript"
import generateFromTypeNode from "."
import { type DependencyMap, type InternalParserModelMap, type TypeParamMap } from ".."
import { type ParserModel, ParserModelType } from "../../domain/ParserModel"

export default function generateFromIntersectionTypeNode(
  typeNode: ts.IntersectionTypeNode,
  type: ts.IntersectionType,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const subtypeModels = typeNode.types.reduce<{
    parsers: ParserModel[]
    deps: DependencyMap
  }>(
    ({ parsers, deps }, subtype, index) => {
      const subtypeModel = generateFromTypeNode(
        subtype,
        type.types[index],
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        parsers: [...parsers, subtypeModel.root],
        deps: subtypeModel.deps,
      }
    },
    { parsers: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Intersection,
      parsers: subtypeModels.parsers,
    },
    deps: subtypeModels.deps,
  }
}
