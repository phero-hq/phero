import type ts from "typescript"
import {
  type DependencyMap,
  type InternalParserModelMap,
  type TypeParamMap,
} from ".."
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
