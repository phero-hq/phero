import ts from "typescript"
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParserModelType } from "../../domain/ParserModel"
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
