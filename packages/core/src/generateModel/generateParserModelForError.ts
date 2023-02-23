import ts from "typescript"
import { DependencyMap } from "."
import { PheroParseError } from "../domain/errors"
import {
  MemberParserModel,
  ParserModelType,
  ObjectParserModel,
} from "../domain/ParserModel"
import { PheroErrorProperty } from "../domain/PheroApp"
import { hasModifier, getNameAsString } from "../lib/tsUtils"
import generateFromTypeNode from "./generateFromTypeNode"

export interface ErrorParserModel {
  properties: PheroErrorProperty[]
  errorModel: ObjectParserModel
  deps: DependencyMap
}

export default function generateParserModelForError(
  classDeclaration: ts.ClassDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): ErrorParserModel {
  const properties: PheroErrorProperty[] = []

  for (const member of classDeclaration.members) {
    if (
      (ts.isPropertyDeclaration(member) ||
        ts.isGetAccessorDeclaration(member)) &&
      (member.modifiers === undefined ||
        hasModifier(member, ts.SyntaxKind.PublicKeyword))
    ) {
      if (!member.type) {
        throw new PheroParseError("Property must have type", member)
      }

      properties.push({
        name: getNameAsString(member.name),
        optional: !!member.questionToken,
        type: member.type,
      })
    }

    if (ts.isConstructorDeclaration(member)) {
      for (const param of member.parameters) {
        if (
          // hasModifier(param, ts.SyntaxKind.PublicKeyword) &&
          !ts.isObjectBindingPattern(param.name) &&
          !ts.isArrayBindingPattern(param.name)
        ) {
          if (!param.type) {
            throw new PheroParseError("Parameter must have type", member)
          }

          properties.push({
            name: getNameAsString(param.name),
            optional: !!param.questionToken,
            type: param.type,
          })
        }
      }
    }
  }

  const memberModels = properties.reduce<{
    models: MemberParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, { name, optional, type }) => {
      const memberParser = generateFromTypeNode(
        type,
        typeChecker.getTypeAtLocation(type),
        type,
        typeChecker,
        deps,
        new Map(),
      )
      return {
        models: [
          ...models,
          {
            type: ParserModelType.Member,
            name,
            optional,
            parser: memberParser.root,
          },
        ],
        deps: memberParser.deps,
      }
    },
    { models: [], deps },
  )

  const errorModel: ObjectParserModel = {
    type: ParserModelType.Object,
    members: memberModels.models,
  }

  return { properties, errorModel, deps: memberModels.deps }
}
