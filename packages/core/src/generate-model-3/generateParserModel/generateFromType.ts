import ts from "typescript"
import { DependencyMap, TypeParamMap, InternalParserModelMap } from "."
import { ParseError } from "../../domain/errors"
import { printCode } from "../../lib/tsTestUtils"
import { getTypeFlags } from "../generateParserModelUtils"
import {
  ParserModelType,
  IndexMemberParserModel,
  MemberParserModel,
  ParserModel,
} from "../ParserModel"
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
    const memberModels = type.getProperties().reduce<{
      models: (IndexMemberParserModel | MemberParserModel)[]
      deps: DependencyMap
    }>(
      ({ models, deps }, prop) => {
        const propType = typeChecker.getTypeOfSymbolAtLocation(prop, typeNode)

        const propSignature = prop.declarations?.[0]

        if (!propSignature || !ts.isPropertySignature(propSignature)) {
          throw new ParseError(
            "Unexpected declaration " + typeNode.kind,
            typeNode,
          )
        }

        if (!propSignature.type) {
          throw new ParseError("Property must have type", propSignature)
        }

        const propModel = generateFromTypeNode(
          propSignature.type,
          propType,
          location,
          typeChecker,
          deps,
          typeParams,
        )

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

    const stringIndexType = type.getStringIndexType()
    const numberIndexType = type.getNumberIndexType()
    let depsIndexTypes = memberModels.deps
    if (stringIndexType) {
      const x = generateFromType(
        stringIndexType,
        typeNode,
        location,
        typeChecker,
        depsIndexTypes,
        typeParams,
      )
      depsIndexTypes = x.deps
      memberModels.models.push({
        type: ParserModelType.IndexMember,
        keyParser: { type: ParserModelType.String },
        optional: false,
        parser: x.root,
      } as const)
    }
    if (numberIndexType) {
      const x = generateFromType(
        numberIndexType,
        typeNode,
        location,
        typeChecker,
        depsIndexTypes,
        typeParams,
      )
      depsIndexTypes = x.deps
      memberModels.models.push({
        type: ParserModelType.IndexMember,
        keyParser: { type: ParserModelType.Number },
        optional: false,
        parser: x.root,
      } as const)
    }

    return {
      root: {
        type: ParserModelType.Object,
        members: memberModels.models,
      },
      deps: depsIndexTypes,
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
        oneOf: unionModels.models,
      },
      deps: unionModels.deps,
    }
  } else if (type.flags & ts.TypeFlags.Undefined) {
    return { root: { type: ParserModelType.Undefined }, deps }
  } else if (type.flags & ts.TypeFlags.Never) {
    throw new ParseError("Never will never be supported", typeNode)
  }

  throw new Error(
    `ParserModel for Type with flags (${getTypeFlags(type).join(
      " | ",
    )}) not implemented + ${typeParams.has("T")}`,
  )
}
