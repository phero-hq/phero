import ts from "typescript"
import generateFromTypeNode from "."
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import { ParseError } from "../../../domain/errors"
import { printCode } from "../../../lib/tsTestUtils"
import {
  ParserModel,
  ParserModelType,
  TupleElementParserModel,
  TupleParserModel,
} from "../../ParserModel"

export default function generateFromTupleTypeNode(
  typeNode: ts.TupleTypeNode,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  // const elementTypes = type.typeArguments?.map((t) => t)
  const elementTypes = typeChecker.getTypeArguments(type).map((t) => t)

  if (!elementTypes) {
    throw new ParseError("Tuple should have element type", typeNode)
  }

  const elementModels = xxx(
    typeNode,
    elementTypes,
    location,
    typeChecker,
    deps,
    typeParams,
    type,
  )

  return {
    root: {
      type: ParserModelType.Tuple,
      elements: elementModels.models,
    },
    deps: elementModels.deps,
  }
}

function xxx(
  typeNode: ts.TupleTypeNode,
  elementTypes: ts.Type[],
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
  type: ts.Type,
): {
  models: TupleElementParserModel[]
  deps: DependencyMap
} {
  let index = 0

  return typeNode.elements.reduce<{
    models: TupleElementParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, subtype) => {
      if (ts.isRestTypeNode(subtype)) {
        const restTypeModel = generateFromTypeNode(
          subtype.type,
          typeChecker.getTypeAtLocation(subtype.type),
          location,
          typeChecker,
          deps,
          typeParams,
        )

        if (restTypeModel.root.type === ParserModelType.Array) {
          return {
            models: [
              ...models,
              {
                type: ParserModelType.TupleElement,
                position: index++,
                isRestElement: true,
                parser: restTypeModel.root.element.parser,
              },
            ],
            deps: restTypeModel.deps,
          }
        }
        if (restTypeModel.root.type === ParserModelType.Tuple) {
          return {
            models: [
              ...models,
              ...restTypeModel.root.elements.map((el) => ({
                ...el,
                position: index + el.position,
              })),
            ],
            deps: restTypeModel.deps,
          }
        }
        return {
          models: [
            ...models,
            {
              type: ParserModelType.TupleElement,
              position: index++,
              isRestElement: true,
              parser: restTypeModel.root,
            },
          ],
          deps: restTypeModel.deps,
        }
      }

      const subtypeModel = generateFromTypeNode(
        subtype,
        elementTypes[index],
        location,
        typeChecker,
        deps,
        typeParams,
      )

      return {
        models: [
          ...models,
          {
            type: ParserModelType.TupleElement,
            position: index++,
            parser: subtypeModel.root,
          },
        ],
        deps: subtypeModel.deps,
      }
    },
    { models: [], deps },
  )
}
