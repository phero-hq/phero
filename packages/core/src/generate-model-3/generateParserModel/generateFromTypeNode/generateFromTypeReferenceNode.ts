import ts from "typescript"
import generateFromTypeNode from "."
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParseError } from "../../../domain/errors"
import { printCode } from "../../../lib/tsTestUtils"
import {
  ParserModel,
  ParserModelType,
  ReferenceParserModel,
} from "../../ParserModel"
import generateFromDeclaration from "../generateFromDeclaration"
import generateFromType from "../generateFromType"

export default function generateFromTypeReferenceNode(
  typeNode: ts.TypeReferenceType,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const declaration = getDeclaration(typeNode, typeChecker)

  return generateFromDeclaration(
    typeNode,
    declaration,
    type,
    location,
    typeChecker,
    deps,
    typeParams,
  )
}

function getDeclaration(
  typeNode: ts.TypeReferenceType,
  typeChecker: ts.TypeChecker,
): ts.Declaration {
  const symbol = typeChecker.getSymbolAtLocation(
    ts.isTypeReferenceNode(typeNode) ? typeNode.typeName : typeNode.expression,
  )
  if (!symbol) {
    throw new ParseError("Entity must have symbol", typeNode)
  }

  const declaration = symbol?.declarations?.[0]
  if (!declaration) {
    throw new ParseError("Entity must have declaration", typeNode)
  }

  return declaration
}
