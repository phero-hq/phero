import ts from "typescript"
import { DependencyMap, TypeParamMap, InternalParserModelMap } from ".."
import { ParseError } from "../../../domain/errors"
import generateFromTypeNode from "../generateFromTypeNode"
import generateFromEnumDeclaration from "./generateFromEnumDeclaration"
import generateFromEnumMemberDeclaration from "./generateFromEnumMemberDeclaration"
import generateFromInterfaceDeclaration from "./generateFromInterfaceDeclaration"

export default function generateFromDeclaration(
  typeNode: ts.TypeReferenceType,
  declaration: ts.Declaration,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (ts.isEnumDeclaration(declaration)) {
    const enumParser = generateFromEnumDeclaration(declaration, typeChecker)
    return { root: enumParser, deps }
  }

  if (ts.isEnumMember(declaration)) {
    const enumMemberParser = generateFromEnumMemberDeclaration(
      declaration,
      typeChecker,
    )
    return { root: enumMemberParser, deps }
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    const result = generateFromInterfaceDeclaration(
      declaration,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    return result
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    const result = generateFromTypeNode(
      declaration.type,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    return result
  }

  throw new ParseError(
    `Reference to type with kind ${
      ts.tokenToString(declaration.kind) ?? declaration.kind.toString()
    } not supported`,
    typeNode,
  )
}
