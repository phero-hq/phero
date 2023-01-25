import ts from "typescript"
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParseError } from "../../../domain/errors"
import { printCode } from "../../../lib/tsTestUtils"
import { getTypeFlags } from "../../generateParserModelUtils"
import {
  ParserModelType,
  MemberParserModel,
  ParserModel,
} from "../../ParserModel"
import generateFromDeclaration from "../generateFromDeclaration"
import generateFromType from "../generateFromType"
import generateFromTypeNode from "./generateFromTypeNode"

export default function generateFromTypeOperatorNode(
  typeNode: ts.TypeOperatorNode,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (typeNode.operator != ts.SyntaxKind.KeyOfKeyword) {
    throw new ParseError("Operator not supported", typeNode)
  }

  if (ts.isTypeQueryNode(typeNode.type)) {
    return generateFromType(
      type,
      typeNode.type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  const keyOfType = typeChecker.getTypeAtLocation(typeNode.type)

  if (keyOfType.isClass()) {
    return generateFromType(
      type,
      typeNode.type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  const typeModel = generateFromTypeNode(
    typeNode.type,
    keyOfType,
    location,
    typeChecker,
    deps,
    typeParams,
  )

  const ms: ParserModel[] = enumeratePropertiesOfParserModel(
    typeModel.root,
    typeModel.deps,
    typeNode,
  ).map((m) => ({
    type: ParserModelType.StringLiteral,
    literal: m,
  }))

  if (ms.length === 1) {
    return {
      root: ms[0],
      deps,
    }
  }

  return {
    root: {
      type: ParserModelType.Union,
      oneOf: ms,
    },
    deps,
  }
}

function enumeratePropertiesOfParserModel(
  model: ParserModel,
  deps: DependencyMap,
  typeNode: ts.TypeOperatorNode,
): string[] {
  if (model.type === ParserModelType.Object) {
    return model.members
      .filter((m): m is MemberParserModel => m.type === ParserModelType.Member)
      .map((m) => m.name)
  }

  if (model.type === ParserModelType.Reference) {
    const referenceModel = deps.get(model.typeName)
    if (!referenceModel) {
      throw new ParseError(
        "Can't enumerate properties of reference with name " + model.typeName,
        typeNode,
      )
    }
    return enumeratePropertiesOfParserModel(referenceModel, deps, typeNode)
  }

  if (model.type === ParserModelType.Generic) {
    return enumeratePropertiesOfParserModel(model.parser, deps, typeNode)
  }

  throw new ParseError(
    "Can't enumerate properties of model with type " + model.type,
    typeNode,
  )
}
