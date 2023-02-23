import { deepEqual } from "assert"
import ts from "typescript"
import { PheroParseError } from "../domain/errors"

import { MemberParserModel } from "../domain/ParserModel"
import {
  PheroFunction,
  PheroMiddlewareConfig,
  PheroServiceConfig,
} from "../domain/PheroApp"
import { getNameAsString } from "../lib/tsUtils"

export interface ServiceContext {
  properties: ContextProperty[]
}

interface ContextProperty {
  signature: ts.PropertySignature
  location: ts.TypeNode
}

export default function parseServiceContextType(
  serviceConfig: PheroServiceConfig,
  pheroFunctions: PheroFunction[],
): ServiceContext | undefined {
  const { accumulatedContext, serviceContextProperties } =
    calculateServiceContext(serviceConfig.middleware ?? [])

  for (const {
    contextParameterType,
    contextParameterTypeModel,
  } of pheroFunctions) {
    if (!contextParameterType || !contextParameterTypeModel) {
      continue
    }

    for (const contextParameterTypeModelMember of contextParameterTypeModel.members as MemberParserModel[]) {
      const accumulatedMember = accumulatedContext.find(
        (m) => m.name === contextParameterTypeModelMember.name,
      )
      if (!accumulatedMember) {
        throw new PheroParseError(
          "Context member is not accumulated in middlewares",
          contextParameterType,
        )
      } else {
        deepEqual(
          contextParameterTypeModelMember,
          accumulatedMember,
          new PheroParseError(
            "Context member is overwritten with other structure",
            contextParameterType,
          ),
        )
      }
    }
  }

  if (serviceContextProperties.length === 0) {
    return undefined
  }

  return { properties: serviceContextProperties }
}

interface MiddlewareContext {
  accumulatedContext: MemberParserModel[]
  serviceContextProperties: ContextProperty[]
}

function calculateServiceContext(
  middlewares: PheroMiddlewareConfig[],
): MiddlewareContext {
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
          serviceContextProperties.push(
            contextTypeProps[contextTypeModelMember.name],
          )
          accumulatedContext.push(contextTypeModelMember)
        } else {
          deepEqual(
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
          deepEqual(
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

  return { accumulatedContext, serviceContextProperties }
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
