import ts from "typescript"
import generateFromTypeNode from "."
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParseError } from "../../../domain/errors"
import { ParserModel, ParserModelType } from "../../ParserModel"

export default function generateFromTupleTypeNode(
  typeNode: ts.TupleTypeNode,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const elementTypes = type.typeArguments

  if (!elementTypes) {
    throw new ParseError("Tuple should have element type", typeNode)
  }

  const elementModels = typeNode.elements.reduce<{
    models: ParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, subtype, index) => {
      const subtypeModel = generateFromTypeNode(
        subtype,
        elementTypes[index],
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        models: [...models, subtypeModel.root],
        deps: subtypeModel.deps,
      }
    },
    { models: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Tuple,
      elements: elementModels.models.map((elementModel, position) => ({
        type: ParserModelType.TupleElement,
        position,
        parser: elementModel,
      })),
    },
    deps: elementModels.deps,
  }
}
