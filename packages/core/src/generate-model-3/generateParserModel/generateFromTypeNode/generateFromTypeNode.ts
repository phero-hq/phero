import ts from "typescript"
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParseError } from "../../../domain/errors"
import { printCode } from "../../../lib/tsTestUtils"
import { getTypeFlags } from "../../generateParserModelUtils"
import { MemberParserModel, ParserModelType } from "../../ParserModel"
import generateFromType from "../generateFromType"

import generateFromArrayTypeNode from "./generateFromArrayTypeNode"
import generateFromIntersectionTypeNode from "./generateFromIntersectionTypeNode"
import generateFromLiteralTypeNode from "./generateFromLiteralTypeNode"
import generateFromParenthesizedTypeNode from "./generateFromParenthesizedTypeNode"
import generateFromTokenTypeNode from "./generateFromTokenTypeNode"
import generateFromTupleTypeNode from "./generateFromTupleTypeNode"
import generateFromTypeLiteralNode from "./generateFromTypeLiteralNode"
import generateFromTypeOperatorNode from "./generateFromTypeOperatorNode"
import generateFromTypeReferenceNode from "./generateFromTypeReferenceNode"
import generateFromUnionTypeNode from "./generateFromUnionTypeNode"

export default function generateFromTypeNode(
  typeNode: ts.TypeNode,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (ts.isToken(typeNode)) {
    return { root: generateFromTokenTypeNode(typeNode), deps }
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    return { root: generateFromLiteralTypeNode(typeNode, typeChecker), deps }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    // console.group("array", printCode(typeNode))
    const result = generateFromArrayTypeNode(
      typeNode,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isUnionTypeNode(typeNode)) {
    if (!type.isUnion()) {
      throw new ParseError("Type should be Union", typeNode)
    }
    // console.group("union", printCode(typeNode))
    const result = generateFromUnionTypeNode(
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    if (!type.isIntersection()) {
      throw new ParseError("Type should be Intersection", typeNode)
    }
    // console.group("intersection", printCode(typeNode))
    const result = generateFromIntersectionTypeNode(
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    // console.group("Parenthesized", printCode(typeNode))
    const result = generateFromParenthesizedTypeNode(
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isTupleTypeNode(typeNode)) {
    // console.group("tuple", printCode(typeNode))
    const result = generateFromTupleTypeNode(
      typeNode,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    // console.group("typeLiteral", printCode(typeNode))
    const result = generateFromTypeLiteralNode(
      typeNode,
      type as ts.ObjectType,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const result = generateFromTypeReferenceNode(
      typeNode,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isConditionalTypeNode(typeNode)) {
    return generateFromType(
      type,
      typeNode,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  if (ts.isMappedTypeNode(typeNode)) {
    return generateFromType(
      type,
      typeNode,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  if (ts.isTypeOperatorNode(typeNode)) {
    return generateFromTypeOperatorNode(
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  if (ts.isIndexedAccessTypeNode(typeNode)) {
    return generateFromType(
      type,
      typeNode,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  throw new ParseError("TypeNode not implemented " + typeNode.kind, typeNode)
}
