import ts from "typescript"
import {
  type DependencyMap,
  type InternalParserModelMap,
  type TypeParamMap,
} from "."
import { PheroParseError } from "../domain/errors"
import {
  getObjectFlags,
  getSymbolFlags,
  getTypeFlags,
} from "./generateParserModelUtils"
import {
  type IndexMemberParserModel,
  type MemberParserModel,
  type ParserModel,
  ParserModelType,
  type TupleElementParserModel,
} from "../domain/ParserModel"
import generateFromTypeNode from "./generateFromTypeNode"

export default function generateFromType(
  type: ts.Type,
  typeNode: ts.TypeNode,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (type.flags & ts.TypeFlags.StringLiteral) {
    const s = type as ts.StringLiteralType
    return {
      root: {
        type: ParserModelType.StringLiteral,
        literal: s.value,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.NumberLiteral) {
    const s = type as ts.NumberLiteralType
    return {
      root: {
        type: ParserModelType.NumberLiteral,
        literal: s.value,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.BooleanLiteral) {
    return {
      root: {
        type: ParserModelType.BooleanLiteral,
        // this is the way...
        literal: typeChecker.typeToString(type) === "true",
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.String) {
    return {
      root: {
        type: ParserModelType.String,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.Number) {
    return {
      root: {
        type: ParserModelType.Number,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.Boolean) {
    return {
      root: {
        type: ParserModelType.Boolean,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.Object) {
    const objectFlags: ts.ObjectFlags = (type as ts.ObjectType).objectFlags
    if (
      objectFlags & ts.ObjectFlags.Reference &&
      (type as ts.TypeReference).target.objectFlags & ts.ObjectFlags.Tuple
    ) {
      const elements = typeChecker
        .getTypeArguments(type as ts.TypeReference)
        .reduce<{ models: TupleElementParserModel[]; deps: DependencyMap }>(
          ({ models, deps }, elementType, index) => {
            const elementModel = generateFromType(
              elementType,
              typeNode,
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
                  parser: elementModel.root,
                },
              ],
              deps: elementModel.deps,
            }
          },
          { models: [], deps },
        )
      return {
        root: {
          type: ParserModelType.Tuple,
          elements: elements.models,
        },
        deps,
      }
    } else if (
      objectFlags & ts.ObjectFlags.ArrayLiteral ||
      (objectFlags & ts.ObjectFlags.Reference && type.symbol.name === "Array")
    ) {
      const elements = typeChecker.getTypeArguments(type as ts.TypeReference)
      if (elements.length !== 1) {
        throw new PheroParseError(
          "Expected one type argument for ArrayLiteral",
          typeNode,
        )
      }

      const elementModel = generateFromType(
        elements[0],
        typeNode,
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        root: {
          type: ParserModelType.Array,
          element: {
            type: ParserModelType.ArrayElement,
            parser: elementModel.root,
          },
        },
        deps: elementModel.deps,
      }
    } else if (type?.symbol.flags & ts.SymbolFlags.Function) {
      throw new PheroParseError(
        "Can't make a parser for a function type",
        typeNode,
      )
    } else {
      const memberModels = type.getProperties().reduce<{
        models: (IndexMemberParserModel | MemberParserModel)[]
        deps: DependencyMap
      }>(
        ({ models, deps }, prop) => {
          const propType = typeChecker.getTypeOfSymbolAtLocation(prop, typeNode)

          let propModel: InternalParserModelMap

          if (ts.isMappedTypeNode(typeNode)) {
            propModel = generateFromTypeNode(
              typeNode,
              propType,
              location,
              typeChecker,
              deps,
              typeParams,
            )
          } else {
            const propSignature = prop.declarations?.[0]

            if (propSignature && ts.isPropertySignature(propSignature)) {
              if (!propSignature.type) {
                throw new PheroParseError(
                  "Property must have type",
                  propSignature,
                )
              }

              propModel = generateFromTypeNode(
                propSignature.type,
                propType,
                location,
                typeChecker,
                deps,
                typeParams,
              )
            } else if (
              propSignature &&
              ts.isPropertyAssignment(propSignature)
            ) {
              const type = typeChecker.getTypeAtLocation(
                propSignature.initializer,
              )

              if (!type) {
                throw new PheroParseError(
                  "Property assignment type not inferable",
                  propSignature,
                )
              }

              propModel = generateFromType(
                type,
                typeNode,
                location,
                typeChecker,
                deps,
                typeParams,
              )
            } else {
              throw new PheroParseError(
                "Unexpected declaration " + typeNode.kind + " >> " + prop.name,
                typeNode,
              )
            }
          }

          return {
            models: [
              ...models,
              {
                type: ParserModelType.Member,
                name: prop.name,
                optional:
                  (prop.flags & ts.SymbolFlags.Optional) ===
                  ts.SymbolFlags.Optional,
                parser: propModel.root,
              },
            ],
            deps: propModel.deps,
          }
        },
        { models: [], deps },
      )

      const { deps: depsIndexTypes, models: indexModels } =
        generateFromIndexType(
          typeNode,
          type,
          location,
          typeChecker,
          memberModels.deps,
          typeParams,
        )

      memberModels.models.push(...indexModels)

      return {
        root: {
          type: ParserModelType.Object,
          members: memberModels.models,
        },
        deps: depsIndexTypes,
      }
    }
  } else if (type.flags & ts.TypeFlags.Union) {
    const unionType = type as ts.UnionType
    const unionModels = unionType.types.reduce<{
      models: ParserModel[]
      deps: DependencyMap
    }>(
      ({ models, deps }, type) => {
        const typeModel = generateFromType(
          type,
          typeNode,
          location,
          typeChecker,
          deps,
          typeParams,
        )

        return {
          models: [...models, typeModel.root],
          deps: typeModel.deps,
        }
      },
      { models: [], deps },
    )

    return {
      root: {
        type: ParserModelType.Union,
        oneOf: fixBooleanLiterals(unionModels.models),
      },
      deps: unionModels.deps,
    }
  } else if (type.flags & ts.TypeFlags.Intersection) {
    const unionType = type as ts.IntersectionType
    const unionModels = unionType.types.reduce<{
      models: ParserModel[]
      deps: DependencyMap
    }>(
      ({ models, deps }, type) => {
        const typeModel = generateFromType(
          type,
          typeNode,
          location,
          typeChecker,
          deps,
          typeParams,
        )

        return {
          models: [...models, typeModel.root],
          deps: typeModel.deps,
        }
      },
      { models: [], deps },
    )

    return {
      root: {
        type: ParserModelType.Intersection,
        parsers: unionModels.models,
      },
      deps: unionModels.deps,
    }
  } else if (type.flags & ts.TypeFlags.Undefined) {
    return { root: { type: ParserModelType.Undefined }, deps }
  } else if (type.flags & ts.TypeFlags.Never) {
    throw new PheroParseError("Never will never be supported", typeNode)
  } else if (type.flags & ts.TypeFlags.TemplateLiteral) {
    const templateLiteralType = type as ts.TemplateLiteralType

    const parsers: ParserModel[] = []

    for (let i = 0; i < templateLiteralType.texts.length; i++) {
      if (templateLiteralType.texts[i]) {
        parsers.push({
          type: ParserModelType.StringLiteral,
          literal: templateLiteralType.texts[i],
        })
      }
      if (templateLiteralType.types[i]) {
        parsers.push(
          generateFromType(
            templateLiteralType.types[i],
            typeNode,
            location,
            typeChecker,
            deps,
            typeParams,
          ).root,
        )
      }
    }

    return {
      root: {
        type: ParserModelType.TemplateLiteral,
        parsers,
      },
      deps,
    }
  }

  throw new PheroParseError(
    `ParserModel for Type with flags (${getTypeFlags(type).join(
      " | ",
    )}) not implemented`,
    typeNode,
  )
}

function generateFromIndexType(
  typeNode: ts.TypeNode,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): { models: IndexMemberParserModel[]; deps: DependencyMap } {
  const models: IndexMemberParserModel[] = []

  const stringIndexType = type.getStringIndexType()
  const numberIndexType = type.getNumberIndexType()

  if (stringIndexType) {
    const stringIndexModel = generateFromType(
      stringIndexType,
      typeNode,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    models.push({
      type: ParserModelType.IndexMember,
      keyParser: { type: ParserModelType.String },
      optional: false,
      parser: stringIndexModel.root,
    })
    deps = stringIndexModel.deps
  }

  if (numberIndexType) {
    const stringIndexModel = generateFromType(
      numberIndexType,
      typeNode,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    models.push({
      type: ParserModelType.IndexMember,
      keyParser: { type: ParserModelType.Number },
      optional: false,
      parser: stringIndexModel.root,
    })
    deps = stringIndexModel.deps
  }

  return { models, deps }
}

function fixBooleanLiterals(models: ParserModel[]): ParserModel[] {
  const trueLiteralIndex = models.findIndex(
    (m) => m.type === ParserModelType.BooleanLiteral && m.literal,
  )

  if (trueLiteralIndex === -1) {
    return models
  }

  const falseLiteralIndex = models.findIndex(
    (m) => m.type === ParserModelType.BooleanLiteral && !m.literal,
  )

  if (falseLiteralIndex === -1) {
    return models
  }

  const smallestIndex = Math.min(trueLiteralIndex, falseLiteralIndex)
  const otherIndex =
    smallestIndex === trueLiteralIndex ? falseLiteralIndex : trueLiteralIndex

  return models.reduce<ParserModel[]>((result, model, index) => {
    if (index === smallestIndex) {
      return [...result, { type: ParserModelType.Boolean }]
    }
    if (index === otherIndex) {
      return result
    }
    return [...result, model]
  }, [])
}
