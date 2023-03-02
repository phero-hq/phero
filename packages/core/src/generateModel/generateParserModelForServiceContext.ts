import ts from "typescript"
import { DependencyMap } from "."
import { PheroParseError } from "../domain/errors"
import {
  MemberParserModel,
  ObjectParserModel,
  ParserModelType,
} from "../domain/ParserModel"
import { getNameAsString } from "../lib/tsUtils"
import { ServiceContext } from "../parsePheroApp/parseServiceContextType"
import generateFromTypeNode from "./generateFromTypeNode"

export interface ServiceContextParserModel {
  root: ObjectParserModel
  deps: DependencyMap
}

export default function generateParserModelForServiceContext(
  serviceContext: ServiceContext,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): ServiceContextParserModel {
  const members: MemberParserModel[] = []

  for (const prop of serviceContext.properties) {
    if (!prop.signature.type) {
      throw new PheroParseError("Property must have type", prop.signature)
    }
    const { root: propParser } = generateFromTypeNode(
      prop.signature.type,
      typeChecker.getTypeAtLocation(prop.signature),
      prop.location,
      typeChecker,
      deps,
      new Map(),
    )

    members.push({
      type: ParserModelType.Member,
      name: getNameAsString(prop.signature.name),
      optional: !!prop.signature.questionToken,
      parser: propParser,
    })
  }

  return {
    root: {
      type: ParserModelType.Object,
      members,
    },
    deps,
  }
}
