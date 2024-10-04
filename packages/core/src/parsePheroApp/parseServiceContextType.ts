import ts from "typescript"
import { PheroParseError } from "../domain/errors"

import {
  ParserModel,
  ParserModelType,
  type MemberParserModel,
} from "../domain/ParserModel"
import {
  type PheroFunction,
  type PheroMiddlewareConfig,
  type PheroServiceConfig,
} from "../domain/PheroApp"
import { DependencyMap } from "../generateModel"
import { getNameAsString } from "../lib/tsUtils"

export interface ServiceContext {
  isRequestPopulated: boolean
  properties: ContextProperty[]
}

interface ContextProperty {
  signature: ts.PropertySignature
  location: ts.TypeNode
}

export default function parseServiceContextType(
  serviceConfig: PheroServiceConfig,
  pheroFunctions: PheroFunction[],
  deps: DependencyMap,
): ServiceContext | undefined {
  const { isRequestPopulated, accumulatedContext, serviceContextProperties } =
    calculateServiceContext(serviceConfig.middleware ?? [], deps)

  for (const {
    contextType: contextParameterType,
    contextTypeModel,
  } of pheroFunctions) {
    if (!contextParameterType || !contextTypeModel) {
      continue
    }

    for (const contextParameterTypeModelMember of contextTypeModel.members as MemberParserModel[]) {
      const accumulatedMember = accumulatedContext.find(
        (m) => m.name === contextParameterTypeModelMember.name,
      )
      if (!accumulatedMember) {
        throw new PheroParseError(
          `Context member "${contextParameterTypeModelMember.name}" is not accumulated in middlewares`,
          contextParameterType,
        )
      } else {
        assertDeepEqual(
          contextParameterTypeModelMember,
          accumulatedMember,
          new PheroParseError(
            `Context member "${contextParameterTypeModelMember.name}" is not accumulated in middlewares`,
            contextParameterType,
          ),
        )
      }
    }
  }

  if (serviceContextProperties.length === 0) {
    return undefined
  }

  return { isRequestPopulated, properties: serviceContextProperties }
}

interface MiddlewareContext {
  isRequestPopulated: boolean
  accumulatedContext: MemberParserModel[]
  serviceContextProperties: ContextProperty[]
}

function calculateServiceContext(
  middlewares: PheroMiddlewareConfig[],
  deps: DependencyMap,
): MiddlewareContext {
  let isRequestPopulated = false
  const accumulatedContext: MemberParserModel[] = []
  const serviceContextProperties: ContextProperty[] = []

  for (const {
    contextType,
    contextTypeModel,
    nextType,
    nextTypeModel,
  } of middlewares) {
    if (contextType) {
      const contextTypeProps = getPropertySignatures(contextType)

      // go through all context members, when they are:
      // NOT accumulated: add them to the serviceContext (and accumulatedContext for next middlewares)
      // accumulated: check whether they have the same structure or else throw
      for (const contextTypeModelMember of contextTypeModel.members as MemberParserModel[]) {
        const accumulatedMember = accumulatedContext.find(
          (m) => m.name === contextTypeModelMember.name,
        )
        if (!accumulatedMember) {
          const contextProp = contextTypeProps[contextTypeModelMember.name]
          if (
            containsPheroUnchecked(contextTypeModelMember, contextType, deps)
          ) {
            if (isPheroRequestProp(contextProp)) {
              if (!isPheroRequestPropNameCorrect(contextProp.signature)) {
                throw new PheroParseError(
                  `PheroRequest can only be set on a property "req", like: "req: PheroRequest".`,
                  contextProp.signature,
                )
              }
              isRequestPopulated = true
            } else {
              throw new PheroParseError(
                "PheroUnchecked can't be service context",
                contextType,
              )
            }
          }

          serviceContextProperties.push(contextProp)

          accumulatedContext.push(contextTypeModelMember)
        } else {
          assertDeepEqual(
            contextTypeModelMember,
            accumulatedMember,
            new PheroParseError(
              "Context member is overwritten with other structure",
              contextType,
            ),
          )
        }
      }
    }

    if (nextType) {
      // go through all next members, when they are:
      // NOT accumulated: add them to the accumulatedContext for next middlewares
      // accumulated: check whether they have the same structure or else throw
      for (const nextTypeModelMember of nextTypeModel.members as MemberParserModel[]) {
        const accumulatedMember = accumulatedContext.find(
          (m) => m.name === nextTypeModelMember.name,
        )
        if (!accumulatedMember) {
          accumulatedContext.push(nextTypeModelMember)
        } else {
          assertDeepEqual(
            nextTypeModelMember,
            accumulatedMember,
            new PheroParseError(
              "Context member is overwritten with other structure",
              nextType,
            ),
          )
        }
      }
    }
  }

  return { isRequestPopulated, accumulatedContext, serviceContextProperties }
}

function isPheroRequestProp(contextProp: ContextProperty): boolean {
  return (
    !!contextProp.signature.type &&
    ts.isTypeReferenceNode(contextProp.signature.type) &&
    ts.isIdentifier(contextProp.signature.type.typeName) &&
    contextProp.signature.type.typeName.text === "PheroRequest" &&
    ts.isIdentifier(contextProp.signature.name)
  )
}
function isPheroRequestPropNameCorrect(prop: ts.PropertySignature): boolean {
  return ts.isIdentifier(prop.name) && prop.name.text === "req"
}

function getPropertySignatures(
  typeNode: ts.TypeNode,
): Record<string, ContextProperty> {
  return findAllProps(typeNode).reduce<Record<string, ContextProperty>>(
    (result, prop) => ({
      ...result,
      [getNameAsString(prop.name)]: { signature: prop, location: typeNode },
    }),
    {},
  )

  function findAllProps(typeNode: ts.TypeNode): ts.PropertySignature[] {
    if (ts.isInterfaceDeclaration(typeNode)) {
      return typeNode.members.filter(ts.isPropertySignature)
    }
    if (ts.isTypeLiteralNode(typeNode)) {
      return typeNode.members.filter(ts.isPropertySignature)
    }
    if (ts.isTypeAliasDeclaration(typeNode)) {
      return findAllProps(typeNode.type)
    }
    if (ts.isIntersectionTypeNode(typeNode)) {
      return typeNode.types.flatMap(findAllProps)
    }
    return []
  }
}

function assertDeepEqual(
  actualMember: MemberParserModel,
  expectedMember: MemberParserModel,
  error: PheroParseError,
): void {
  if (JSON.stringify(actualMember) !== JSON.stringify(expectedMember)) {
    throw error
  }
}

function containsPheroUnchecked(
  parserModel: ParserModel,
  contextType: ts.TypeNode,
  deps: DependencyMap,
): boolean {
  switch (parserModel.type) {
    case ParserModelType.Object:
      return parserModel.members.some((member) =>
        containsPheroUnchecked(member, contextType, deps),
      )
    case ParserModelType.Member:
      return containsPheroUnchecked(parserModel.parser, contextType, deps)
    case ParserModelType.IndexMember:
      return (
        containsPheroUnchecked(parserModel.keyParser, contextType, deps) ||
        containsPheroUnchecked(parserModel.parser, contextType, deps)
      )
    case ParserModelType.Array:
      return containsPheroUnchecked(parserModel.element, contextType, deps)
    case ParserModelType.ArrayElement:
      return containsPheroUnchecked(parserModel.parser, contextType, deps)
    case ParserModelType.Tuple:
      return parserModel.elements.some((element) =>
        containsPheroUnchecked(element, contextType, deps),
      )
    case ParserModelType.TupleElement:
      return containsPheroUnchecked(parserModel.parser, contextType, deps)
    case ParserModelType.Union:
      return parserModel.oneOf.some((element) =>
        containsPheroUnchecked(element, contextType, deps),
      )
    case ParserModelType.Intersection:
      return parserModel.parsers.some((parser) =>
        containsPheroUnchecked(parser, contextType, deps),
      )
    case ParserModelType.Reference:
    case ParserModelType.Generic: {
      const parser = deps.get(parserModel.typeName)
      if (!parser) {
        throw new PheroParseError(
          `Can't find parser with name ${parserModel.typeName}`,
          contextType,
        )
      }
      return containsPheroUnchecked(parser, contextType, deps)
    }

    case ParserModelType.Unchecked:
      return true

    default:
      return false
  }
}
