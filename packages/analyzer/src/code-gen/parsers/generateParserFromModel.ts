import ts from "typescript"
import generateArrayParser, {
  newGenereteArrayParser,
} from "./generateArrayParser"
import generateBooleanLiteralParser from "./generateBooleanLiteralParser"
import generateBooleanParser from "./generateBooleanParser"
import generateEnumParser from "./generateEnumParser"
import generateIntersectionParser from "./generateIntersectionParser"
import generateMemberParser from "./generateMemberParser"
import generateNullParser from "./generateNullParser"
import generateNumberLiteralParser from "./generateNumberLiteralParser"
import generateNumberParser from "./generateNumberParser"
import { newGenereteObjectParser } from "./generateObjectParser"
import {
  generateParserModel,
  ParserModel,
  ParserModelType,
} from "./generateParserModel"
import generateStringLiteralParser from "./generateStringLiteralParser"
import generateStringParser from "./generateStringParser"
import generateTupleParser from "./generateTupleParser"
import generateUndefinedParser from "./generateUndefinedParser"
import generateUnionParser from "./generateUnionParser"

export function generateParserFromModel(
  model: ParserModel,
  ancestors: ParserModel[] = [],
): ts.Statement {
  switch (model.type) {
    case ParserModelType.Root:
      return generateParserFromModel(model.parser, [model])
    case ParserModelType.String:
      return generateStringParser(new NewPointer(model, ancestors))
    case ParserModelType.Object:
      return newGenereteObjectParser(new NewPointer(model, ancestors))
    case ParserModelType.Member:
      return generateMemberParser(new NewPointer(model, ancestors))
    case ParserModelType.StringLiteral:
      return generateStringLiteralParser(new NewPointer(model, ancestors))
    case ParserModelType.Number:
      return generateNumberParser(new NewPointer(model, ancestors))
    case ParserModelType.NumberLiteral:
      return generateNumberLiteralParser(new NewPointer(model, ancestors))
    case ParserModelType.Boolean:
      return generateBooleanParser(new NewPointer(model, ancestors))
    case ParserModelType.BooleanLiteral:
      return generateBooleanLiteralParser(new NewPointer(model, ancestors))
    case ParserModelType.Null:
      return generateNullParser(new NewPointer(model, ancestors))
    case ParserModelType.Undefined:
      return generateUndefinedParser(new NewPointer(model, ancestors))
    case ParserModelType.Array:
      return newGenereteArrayParser(new NewPointer(model, ancestors))
    case ParserModelType.Tuple:
      return generateTupleParser(new NewPointer(model, ancestors))
    case ParserModelType.TupleElement:
    case ParserModelType.ArrayElement:
      return generateParserFromModel(model.parser, [...ancestors, model])
    case ParserModelType.Union:
      return generateUnionParser(new NewPointer(model, ancestors))
    case ParserModelType.Intersection:
      return generateIntersectionParser(new NewPointer(model, ancestors))
    case ParserModelType.Enum:
      return generateEnumParser(new NewPointer(model, ancestors))
  }
}

export class NewPointer<TParserModel extends ParserModel> {
  public readonly path: ParserModel[] = []

  constructor(
    public readonly model: TParserModel,
    private readonly ancestors: ParserModel[],
  ) {
    this.path = [...ancestors, model]
  }

  public get dataVarExpr(): ts.Identifier {
    return ts.factory.createIdentifier(
      this.path
        .map((element) => {
          switch (element.type) {
            case ParserModelType.Root:
              return element.name
            case ParserModelType.Member:
              return `["${element.name}"]`
            case ParserModelType.ArrayElement:
              return `[it_${element.depth}]`
            case ParserModelType.TupleElement:
              return `[${element.position}]`
            default:
              return ""
          }
        })
        .join(""),
    )
  }

  public get resultVarExpr(): ts.Identifier {
    return ts.factory.createIdentifier(
      this.dataVarExpr.text.replace(/^[^\.\[]+/, "result"),
    )
  }

  public get errorPath(): ts.Expression {
    const [head, ...tail] = this.dataVarExpr.text
      // replace ["propName"] with .propName
      .replace(/\["(.+?)"\]+/g, ".$1")
      // split on array indexers
      .split(/\[it_\d+\]/)

    return tail.length
      ? ts.factory.createTemplateExpression(
          ts.factory.createTemplateHead(`${head}[`),
          tail.map((span, i) =>
            ts.factory.createTemplateSpan(
              ts.factory.createIdentifier(`it_${i}`),
              i === tail.length - 1
                ? ts.factory.createTemplateTail(`]${span}`)
                : ts.factory.createTemplateMiddle(`]${span}[`),
            ),
          ),
        )
      : ts.factory.createStringLiteral(head)
  }
}
