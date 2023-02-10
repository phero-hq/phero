import { ParserModel, ParserModelType } from "../generate-model-3/ParserModel"

import ts from "typescript"
import { tsx } from ".."
import {
  DependencyMap,
  FunctionParserModel,
} from "../generate-model-3/generateParserModel"

export type ParserFuncRef = ts.Identifier | ts.CallExpression
export type DependencyParserMap = Map<ts.Identifier, ParserFuncRef>
type DependencyRefs = Record<string, ts.Identifier>

export function generateFunctionParsers(functionModel: FunctionParserModel): {
  inputParser: ParserFuncRef
  outputParser: ParserFuncRef
  dependencyParsers: DependencyParserMap
} {
  const depRef = generateFuncDependencyRefs(functionModel.deps)
  return {
    inputParser: generateParserRef(functionModel.parameters, depRef),
    outputParser: generateParserRef(functionModel.returnType, depRef),
    dependencyParsers: generateFuncDependencyModelMap(
      functionModel.deps,
      depRef,
    ),
  }
}

function generateFuncDependencyRefs(deps: DependencyMap): DependencyRefs {
  return [...deps.keys()].reduce<DependencyRefs>(
    (refs, [typeName], index) => ({
      ...refs,
      [typeName]: tsx.expression.identifier(`dep_${index}`),
    }),
    {},
  )
}

function generateFuncDependencyModelMap(
  deps: DependencyMap,
  depRef: DependencyRefs,
): DependencyParserMap {
  return [...deps.entries()].reduce<DependencyParserMap>(
    (refs, [typeName, model], index) => {
      refs.set(depRef[typeName], generateParserRef(model, depRef))
      return refs
    },
    new Map(),
  )
}

function generateParserRef(
  model: ParserModel,
  depRefs: Record<string, ts.Identifier>,
): ParserFuncRef {
  switch (model.type) {
    case ParserModelType.Any:
      return tsx.expression.identifier("AnyParser")
    case ParserModelType.String:
      return tsx.expression.identifier("StringParser")
    case ParserModelType.StringLiteral:
      return tsx.expression.call("StringLiteralParser", {
        args: [tsx.literal.string(model.literal)],
      })
    case ParserModelType.Number:
      return tsx.expression.identifier("NumberParser")
    case ParserModelType.NumberLiteral:
      return tsx.expression.call("NumberLiteralParser", {
        args: [tsx.literal.number(model.literal)],
      })
    case ParserModelType.Boolean:
      return tsx.expression.identifier("BooleanParser")
    case ParserModelType.BooleanLiteral:
      return tsx.expression.call("BooleanLiteralParser", {
        args: [tsx.literal.boolean(model.literal)],
      })
    case ParserModelType.Null:
      return tsx.expression.identifier("NullParser")
    case ParserModelType.Undefined:
      return tsx.expression.identifier("UndefinedParser")
    case ParserModelType.Date:
      return tsx.expression.identifier("DateParser")
    case ParserModelType.BigInt:
      return tsx.expression.identifier("BigIntParser")
    case ParserModelType.BigIntLiteral:
      return tsx.expression.call("BigIntLiteralParser", {
        args: [
          tsx.literal.string(
            `${model.literal.negative ? "-" : ""}${model.literal.base10Value}`,
          ),
        ],
      })

    case ParserModelType.Array:
      return tsx.expression.call(`ArrayParser`, {
        args: [generateParserRef(model.element.parser, depRefs)],
      })

    case ParserModelType.Union:
      return tsx.expression.call(`UnionParser`, {
        args: [...model.oneOf.map((el) => generateParserRef(el, depRefs))],
      })
    case ParserModelType.Intersection:
      return tsx.expression.call(`IntersectionParser`, {
        args: [...model.parsers.map((el) => generateParserRef(el, depRefs))],
      })
    case ParserModelType.Tuple:
      return tsx.expression.call(`TupleParser`, {
        args: [
          ...model.elements.map((el) =>
            tsx.literal.object(
              tsx.property.assignment(
                "parser",
                generateParserRef(el.parser, depRefs),
              ),
              tsx.property.assignment(
                "isRestElement",
                tsx.literal.boolean(el.isRestElement ?? false),
              ),
            ),
          ),
        ],
      })
    case ParserModelType.ArrayElement:
    case ParserModelType.TupleElement:
    case ParserModelType.Member:
    case ParserModelType.IndexMember:
    case ParserModelType.EnumMember:
      throw new Error("xxx")

    case ParserModelType.Object:
      return tsx.expression.call(`ObjectLiteralParser`, {
        args: model.members.map((el) =>
          el.type === ParserModelType.Member
            ? tsx.literal.array(
                tsx.literal.string(el.name),
                tsx.literal.boolean(el.optional),
                generateParserRef(el.parser, depRefs),
              )
            : tsx.literal.array(
                generateParserRef(el.keyParser, depRefs),
                tsx.literal.boolean(el.optional),
                generateParserRef(el.parser, depRefs),
              ),
        ),
      })

    case ParserModelType.Enum:
      return tsx.expression.call(`EnumParser`, {
        args: model.members.map((el) =>
          el.parser.type === ParserModelType.StringLiteral
            ? tsx.literal.string(el.parser.literal)
            : tsx.literal.number(el.parser.literal),
        ),
      })

    case ParserModelType.Reference: // TODO
      return depRefs[model.typeName]

    case ParserModelType.Generic: // TODO
    case ParserModelType.TemplateLiteral: // TODO
      throw new Error("not implemented")
  }
}
