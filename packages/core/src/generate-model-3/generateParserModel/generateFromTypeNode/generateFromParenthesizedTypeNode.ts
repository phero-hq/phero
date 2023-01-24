import ts from "typescript"
import generateFromTypeNode from "."
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."

export default function generateFromParenthesizedTypeNode(
  typeNode: ts.ParenthesizedTypeNode,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  return generateFromTypeNode(
    typeNode.type,
    type,
    location,
    typeChecker,
    deps,
    typeParams,
  )
}
