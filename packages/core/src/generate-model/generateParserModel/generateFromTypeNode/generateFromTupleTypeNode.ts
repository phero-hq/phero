import ts from "typescript"
import generateFromTypeNode from "."
import { DependencyMap, InternalParserModelMap, TypeParamMap } from ".."
import {
  ParserModel,
  ParserModelType,
  TupleElementParserModel,
} from "../../ParserModel"

export default function generateFromTupleTypeNode(
  typeNode: ts.TupleTypeNode,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const elementTypes = typeChecker.getTypeArguments(type).map((t) => t)

  const elementModels = typeNode.elements.reduce<{
    models: TupleElementParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, subtype, index) => {
      if (ts.isRestTypeNode(subtype)) {
        const restTypeModel = generateFromTypeNode(
          subtype.type,
          typeChecker.getTypeAtLocation(subtype.type),
          location,
          typeChecker,
          deps,
          typeParams,
        )
        return {
          models: normaliseRestTypeModel(models, restTypeModel.root, index),
          deps: restTypeModel.deps,
        }
      } else if (ts.isNamedTupleMember(subtype)) {
        const namedTupleMemberModel = generateFromTypeNode(
          subtype.type,
          elementTypes[index],
          location,
          typeChecker,
          deps,
          typeParams,
        )

        return {
          models: subtype.dotDotDotToken
            ? normaliseRestTypeModel(models, namedTupleMemberModel.root, index)
            : [
                ...models,
                {
                  type: ParserModelType.TupleElement,
                  position: index,
                  parser: namedTupleMemberModel.root,
                },
              ],
          deps: namedTupleMemberModel.deps,
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
            position: index,
            parser: subtypeModel.root,
          },
        ],
        deps: subtypeModel.deps,
      }
    },
    { models: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Tuple,
      elements: elementModels.models,
    },
    deps: elementModels.deps,
  }
}

function normaliseRestTypeModel(
  models: TupleElementParserModel[],
  restTypeModel: ParserModel,
  index: number,
): TupleElementParserModel[] {
  if (restTypeModel.type === ParserModelType.Array) {
    return [
      ...models,
      {
        type: ParserModelType.TupleElement,
        position: index,
        isRestElement: true,
        parser: restTypeModel.element.parser,
      },
    ]
  }
  if (restTypeModel.type === ParserModelType.Tuple) {
    return [
      ...models,
      ...restTypeModel.elements.map((el) => ({
        ...el,
        position: index + el.position,
      })),
    ]
  }
  return [
    ...models,
    {
      type: ParserModelType.TupleElement,
      position: index,
      isRestElement: true,
      parser: restTypeModel,
    },
  ]
}
