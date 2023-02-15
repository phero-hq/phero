import ts from "typescript"
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import generateFromDeclaration from "../generateFromDeclaration"

export default function generateFromTypeReferenceNode(
  typeNode: ts.TypeReferenceType,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  return generateFromDeclaration(
    typeNode,
    type,
    location,
    typeChecker,
    deps,
    typeParams,
  )
}
