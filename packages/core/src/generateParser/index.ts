import {
  ObjectParserModel,
  ParserModel,
  ParserModelType,
} from "../domain/ParserModel"

import ts from "typescript"
import { PheroError, tsx } from ".."
import { DependencyMap, FunctionParserModel } from "../generateModel"

export type ParserFuncRef = ts.Identifier | ts.CallExpression
export type DependencyParserMap = Map<ts.Identifier, ParserFuncRef>
export type DependencyRefs = Record<string, ts.Identifier>

export function generateFunctionParsers(functionModel: FunctionParserModel): {
  inputParser?: ParserFuncRef
  outputParser: ParserFuncRef
  dependencyParsers: DependencyParserMap
} {
  const depRef = generateDependencyRefs(functionModel.deps)

  return {
    inputParser:
      functionModel.parameters &&
      generateParserRef(functionModel.parameters, depRef),
    outputParser: generateParserRef(functionModel.returnType, depRef),
    dependencyParsers: generateFuncDependencyModelMap(
      functionModel.deps,
      depRef,
    ),
  }
}

export function generateInlineParser(
  model: ParserModel,
  typeNode: ts.TypeNode,
  depRefs: DependencyRefs,
): ts.ArrowFunction {
  return tsx.arrowFunction({
    params: [tsx.param({ name: "data", type: tsx.type.unknown })],
    returnType: tsx.type.reference({
      name: "ParseResult",
      args: [typeNode],
    }),
    body: [
      tsx.const({
        name: `_parser`,
        type: tsx.type.reference({
          name: "Parser",
          args: [typeNode],
        }),
        init: generateParserRef(model, depRefs),
      }),
      tsx.statement.return(
        tsx.expression.call("_parser", {
          args: ["data"],
        }),
      ),
    ],
  })
}

export function generateModelParser(
  name: string,
  model: ParserModel,
  depRefs: DependencyRefs,
): ts.FunctionDeclaration {
  return tsx.function({
    name: depRefs[name].text,
    params: [tsx.param({ name: "data", type: tsx.type.unknown })],
    returnType: tsx.type.reference({
      name: "ParseResult",
      args: [tsx.type.reference({ name })],
    }),
    body: [
      tsx.const({
        name: `_parser`,
        type: tsx.type.reference({
          name: "Parser",
          args: [tsx.type.reference({ name })],
        }),
        init: generateParserRef(model, depRefs),
      }),
      tsx.statement.return(
        tsx.expression.call("_parser", {
          args: ["data"],
        }),
      ),
    ],
  })
}

export function generateErrorParser(
  error: PheroError,
  depRefs: DependencyRefs,
): ts.FunctionDeclaration {
  const errorType = tsx.literal.type(
    ...error.properties.map(({ name, type, optional }) =>
      tsx.property.signature(name, type, optional),
    ),
  )
  return tsx.function({
    name: `${error.name}Parser`,
    params: [tsx.param({ name: "data", type: tsx.type.unknown })],
    returnType: tsx.type.reference({
      name: "ParseResult",
      args: [errorType],
    }),
    body: [
      tsx.const({
        name: `_parser`,
        type: tsx.type.reference({
          name: "Parser",
          args: [errorType],
        }),
        init: generateParserRef(error.errorModel, depRefs),
      }),
      tsx.statement.return(
        tsx.expression.call("_parser", {
          args: ["data"],
        }),
      ),
    ],
  })
}

export function generateParserFunction(
  name: string,
  model: ParserModel,
  typeNode: ts.TypeNode,
  depRefs: DependencyRefs,
): ts.VariableStatement {
  return tsx.const({
    name,
    type: tsx.type.reference({
      name: "Parser",
      args: [typeNode],
    }),
    init: generateParserRef(model, depRefs),
  })
}

export function generateDependencyRefs(deps: DependencyMap): DependencyRefs {
  return [...deps.keys()].reduce<DependencyRefs>(
    (refs, typeName, index) => ({
      ...refs,
      [typeName]: typeName.includes("<")
        ? tsx.expression.identifier(`ref_${index}`)
        : // the replace is necessary for EnumMembers
          tsx.expression.identifier(`${typeName.replace(".", "_")}Parser`),
    }),
    {},
  )
}

function generateFuncDependencyModelMap(
  deps: DependencyMap,
  depRef: DependencyRefs,
): DependencyParserMap {
  return [...deps.entries()].reduce<DependencyParserMap>(
    (refs, [typeName, model]) => {
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
      return tsx.expression.identifier("parser.Any")
    case ParserModelType.String:
      return tsx.expression.identifier("parser.String")
    case ParserModelType.StringLiteral:
      return tsx.expression.call("parser.StringLiteral", {
        args: [tsx.literal.string(model.literal)],
      })
    case ParserModelType.Number:
      return tsx.expression.identifier("parser.Number")
    case ParserModelType.NumberLiteral:
      return tsx.expression.call("parser.NumberLiteral", {
        args: [tsx.literal.number(model.literal)],
      })
    case ParserModelType.Boolean:
      return tsx.expression.identifier("parser.Boolean")
    case ParserModelType.BooleanLiteral:
      return tsx.expression.identifier(
        model.literal ? "parser.TrueLiteral" : "parser.FalseLiteral",
      )
    case ParserModelType.Null:
      return tsx.expression.identifier("parser.Null")
    case ParserModelType.Undefined:
      return tsx.expression.identifier("parser.Undefined")
    case ParserModelType.Date:
      return tsx.expression.identifier("parser.Date")
    case ParserModelType.BigInt:
      return tsx.expression.identifier("parser.BigInt")
    case ParserModelType.BigIntLiteral:
      return tsx.expression.call("parser.BigIntLiteral", {
        args: [
          tsx.literal.string(
            `${model.literal.negative ? "-" : ""}${model.literal.base10Value}`,
          ),
        ],
      })

    case ParserModelType.Array:
      return tsx.expression.call("parser.Array", {
        args: [generateParserRef(model.element.parser, depRefs)],
      })

    case ParserModelType.Union:
      return tsx.expression.call("parser.Union", {
        args: [...model.oneOf.map((el) => generateParserRef(el, depRefs))],
      })
    case ParserModelType.Intersection:
      return tsx.expression.call("parser.Intersection", {
        args: [...model.parsers.map((el) => generateParserRef(el, depRefs))],
      })
    case ParserModelType.Tuple:
      return tsx.expression.call("parser.Tuple", {
        args: [
          ...model.elements.map((el) =>
            el.isRestElement
              ? tsx.literal.array(
                  generateParserRef(el.parser, depRefs),
                  tsx.literal.boolean(true),
                )
              : tsx.literal.array(generateParserRef(el.parser, depRefs)),
          ),
        ],
      })

    case ParserModelType.EnumMember:
      return generateParserRef(model.parser, depRefs)

    case ParserModelType.Object:
      return tsx.expression.call("parser.ObjectLiteral", {
        args: model.members.map((el) =>
          el.type === ParserModelType.Member
            ? tsx.literal.array(
                tsx.literal.string(el.name),
                tsx.literal.boolean(el.optional),
                generateParserRef(el.parser, depRefs),
              )
            : tsx.literal.array(
                el.keyParser.type === ParserModelType.Number
                  ? tsx.expression.identifier("parser.NumberKey")
                  : generateParserRef(el.keyParser, depRefs),
                tsx.literal.boolean(el.optional),
                generateParserRef(el.parser, depRefs),
              ),
        ),
      })

    case ParserModelType.Enum:
      return tsx.expression.call("parser.Enum", {
        args: model.members.map((el) =>
          el.parser.type === ParserModelType.StringLiteral
            ? tsx.literal.string(el.parser.literal)
            : tsx.literal.number(el.parser.literal),
        ),
      })

    case ParserModelType.Reference:
      return depRefs[model.typeName]

    case ParserModelType.Generic:
      return generateParserRef(model.parser, depRefs)

    case ParserModelType.TemplateLiteral:
      return tsx.expression.call("parser.TemplateLiteral", {
        args: [
          tsx.literal.regularExpression(
            `/^${model.parsers.map(generateRegExpSegmentForParser).join("")}$/`,
          ),
        ],
      })

    case ParserModelType.ArrayElement:
    case ParserModelType.TupleElement:
    case ParserModelType.Member:
    case ParserModelType.IndexMember:
      throw new Error("Inner models already handled")
  }
}

function generateRegExpSegmentForParser(parser: ParserModel): string {
  switch (parser.type) {
    case ParserModelType.Any:
    case ParserModelType.String:
      return ".+"
    case ParserModelType.StringLiteral:
      // Escape RegExp string
      // https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
      return parser.literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
    case ParserModelType.Number:
    case ParserModelType.BigInt:
      return "\\d+"
    case ParserModelType.NumberLiteral:
      return parser.literal.toString()
    case ParserModelType.BigIntLiteral:
      return (
        (parser.literal.negative ? "\\-" : "") +
        parser.literal.base10Value.toString()
      )
    case ParserModelType.Boolean:
      return "true|false"
    case ParserModelType.BooleanLiteral:
      return parser.literal.toString()
    case ParserModelType.Null:
      return "null"
    case ParserModelType.Undefined:
      return "undefined"

    case ParserModelType.Union:
      return `(${parser.oneOf.map(generateRegExpSegmentForParser).join("|")}`

    case ParserModelType.Enum:
      return `(${parser.members
        .map((member) => generateRegExpSegmentForParser(member.parser))
        .join("|")})`
    case ParserModelType.EnumMember:
      return generateRegExpSegmentForParser(parser.parser)

    // These should all be resolved by the model generator
    case ParserModelType.Intersection:
    case ParserModelType.Reference:
    case ParserModelType.Generic:
    case ParserModelType.TemplateLiteral:

    // TS doesn't support this, so we should not see this
    case ParserModelType.Object:
    case ParserModelType.Member:
    case ParserModelType.IndexMember:
    case ParserModelType.Array:
    case ParserModelType.ArrayElement:
    case ParserModelType.Tuple:
    case ParserModelType.TupleElement:
    case ParserModelType.Date:
      throw new Error("Template literal segment is not supported")
  }
}
