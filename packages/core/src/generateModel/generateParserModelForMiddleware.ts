import ts from "typescript"
import { DependencyMap } from "."
import { PheroParseError } from "../domain/errors"
import {
  MemberParserModel,
  ObjectParserModel,
  ParserModel,
  ParserModelType,
} from "../domain/ParserModel"
import { getTypeName } from "../lib/tsUtils"
import generateFromTypeNode from "./generateFromTypeNode"

export interface MiddlewareParserModel {
  contextType?: ts.TypeNode
  contextTypeModel: ObjectParserModel
  nextType?: ts.TypeNode
  nextTypeModel: ObjectParserModel
}

const emptyObjectModel: ObjectParserModel = {
  type: ParserModelType.Object,
  members: [],
}

export default function generateParserModelForMiddleware(
  middleware: ts.FunctionLikeDeclarationBase,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): MiddlewareParserModel {
  if (middleware.parameters.length !== 2) {
    throw new PheroParseError(
      `S129: Middleware should have three parameters "(ctx: PheroContext<C>, next: PheroNextFunction<T>)"`,
      middleware,
    )
  }

  const [contextParam, nextParam] = middleware.parameters

  return {
    ...parseContextParameter(contextParam, typeChecker, deps),
    ...parseNextParameter(nextParam, typeChecker, deps),
  }
}

function parseContextParameter(
  contextParam: ts.ParameterDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): Pick<MiddlewareParserModel, "contextType" | "contextTypeModel"> {
  const contextType = parseContextTypeNode(contextParam)

  if (!contextType) {
    return { contextType: undefined, contextTypeModel: emptyObjectModel }
  }

  const { root: contextTypeModel } = generateFromTypeNode(
    contextType,
    typeChecker.getTypeAtLocation(contextType),
    contextType,
    typeChecker,
    deps,
    new Map(),
  )

  return {
    contextType,
    contextTypeModel: {
      type: ParserModelType.Object,
      members: parseContextMembers(contextType, contextTypeModel, deps),
    },
  }
}

function parseContextTypeNode(
  contextParam: ts.ParameterDeclaration,
): ts.TypeNode | undefined {
  const contextType = contextParam.type

  if (
    !contextType ||
    !ts.isTypeReferenceNode(contextType) ||
    getTypeName(contextType) !== "PheroContext"
  ) {
    throw new PheroParseError(
      `S131: Middleware ctx parameter has no or incorrect type, should be defined like "ctx: PheroContext<T>"`,
      contextParam,
    )
  }

  return contextType.typeArguments?.[0]
}

function parseNextParameter(
  nextParam: ts.ParameterDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): Pick<MiddlewareParserModel, "nextType" | "nextTypeModel"> {
  const nextType = parseNextTypeNode(nextParam)

  if (!nextType) {
    return { nextType, nextTypeModel: emptyObjectModel }
  }

  const { root: nextTypeModel } = generateFromTypeNode(
    nextType,
    typeChecker.getTypeAtLocation(nextType),
    nextType,
    typeChecker,
    deps,
    new Map(),
  )

  return {
    nextType,
    nextTypeModel: {
      type: ParserModelType.Object,
      members: parseContextMembers(nextType, nextTypeModel, deps),
    },
  }
}

function parseNextTypeNode(
  nextParam: ts.ParameterDeclaration,
): ts.TypeNode | undefined {
  const nextType = nextParam.type

  if (
    !nextType ||
    !ts.isTypeReferenceNode(nextType) ||
    getTypeName(nextType) !== "PheroNextFunction"
  ) {
    throw new PheroParseError(
      `S132: Middleware next parameter has no or incorrect type, should be defined like "next: PheroNextFunction<T>"`,
      nextParam,
    )
  }

  return nextType.typeArguments?.[0]
}

function parseContextMembers(
  typeNode: ts.TypeNode,
  model: ParserModel,
  deps: DependencyMap,
): MemberParserModel[] {
  switch (model.type) {
    case ParserModelType.Object: {
      return model.members.filter((member): member is MemberParserModel => {
        // shouldn't have any IndexMember's
        if (member.type !== ParserModelType.Member) {
          throw new PheroParseError(
            "Index type members are not allowed in a context type",
            typeNode,
          )
        }
        return true
      })
    }
    case ParserModelType.Intersection: {
      return model.parsers.reduce<MemberParserModel[]>(
        (existingMembers, model) => {
          const newMembers = parseContextMembers(typeNode, model, deps)
          return [
            ...existingMembers.filter(
              (existingMemberr) =>
                !newMembers.some(
                  (newMember) => existingMemberr.name === newMember.name,
                ),
            ),
            ...newMembers,
          ]
        },
        [],
      )
    }
    case ParserModelType.Reference:
    case ParserModelType.Generic: {
      const dep = deps.get(model.typeName)
      if (!dep) {
        throw new PheroParseError(
          `Can't find parser with name ${model.typeName}`,
          typeNode,
        )
      }
      return parseContextMembers(typeNode, dep, deps)
    }
    default:
      throw new PheroParseError(
        "The provided type should be a regular object type, without any index type members",
        typeNode,
      )
  }
}
