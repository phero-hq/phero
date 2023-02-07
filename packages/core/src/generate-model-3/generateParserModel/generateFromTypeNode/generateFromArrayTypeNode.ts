import ts from "typescript"
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParseError } from "../../../domain/errors"
import { ParserModelType } from "../../ParserModel"
import generateFromTypeNode from "./generateFromTypeNode"

export default function generateFromArrayTypeNode(
  typeNode: ts.ArrayTypeNode,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const elementType = typeChecker.getTypeAtLocation(typeNode.elementType)

  if (!elementType) {
    throw new ParseError("Array should have element type", typeNode)
  }

  const elementModel = generateFromTypeNode(
    typeNode.elementType,
    elementType,
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
