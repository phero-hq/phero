import ts from "typescript"
import generateAnyParser from "./generateAnyParser"
import generateArrayParser from "./generateArrayParser"
import generateBooleanLiteralParser from "./generateBooleanLiteralParser"
import generateBooleanParser from "./generateBooleanParser"
import generateDateParser from "./generateDateParser"
import generateEnumParser from "./generateEnumParser"
import generateIndexMemberParser from "./generateIndexMemberParser"
import generateIntersectionParser from "./generateIntersectionParser"
import generateMemberParser from "./generateMemberParser"
import generateNullParser from "./generateNullParser"
import generateNumberLiteralParser from "./generateNumberLiteralParser"
import generateNumberParser from "./generateNumberParser"
import generateObjectParser from "./generateObjectParser"
import { ParserModel, ParserModelType } from "./generateParserModel"
import generateReferenceParser from "./generateReferenceParser"
import generateStringLiteralParser from "./generateStringLiteralParser"
import generateStringParser from "./generateStringParser"
import generateTupleParser from "./generateTupleParser"
import generateTypeParameterParser from "./generateTypeParameterParser"
import generateUndefinedParser from "./generateUndefinedParser"
import generateUnionParser from "./generateUnionParser"
import generateVoidParser from "./generateVoidParser"
import Pointer from "./Pointer"

export default function generateParserFromModel(
  model: ParserModel,
  ancestors: ParserModel[] = [],
): ts.Statement {
  switch (model.type) {
    case ParserModelType.Root:
      return generateParserFromModel(model.parser, [model])
    case ParserModelType.String:
      return generateStringParser(new Pointer(model, ancestors))
    case ParserModelType.Object:
      return generateObjectParser(new Pointer(model, ancestors))
    case ParserModelType.Member:
      return generateMemberParser(new Pointer(model, ancestors))
    case ParserModelType.IndexMember:
      return generateIndexMemberParser(new Pointer(model, ancestors))
    case ParserModelType.StringLiteral:
      return generateStringLiteralParser(new Pointer(model, ancestors))
    case ParserModelType.Number:
      return generateNumberParser(new Pointer(model, ancestors))
    case ParserModelType.NumberLiteral:
      return generateNumberLiteralParser(new Pointer(model, ancestors))
    case ParserModelType.Boolean:
      return generateBooleanParser(new Pointer(model, ancestors))
    case ParserModelType.BooleanLiteral:
      return generateBooleanLiteralParser(new Pointer(model, ancestors))
    case ParserModelType.Null:
      return generateNullParser(new Pointer(model, ancestors))
    case ParserModelType.Undefined:
      return generateUndefinedParser(new Pointer(model, ancestors))
    case ParserModelType.Void:
      return generateVoidParser(new Pointer(model, ancestors))
    case ParserModelType.Array:
      return generateArrayParser(new Pointer(model, ancestors))
    case ParserModelType.Tuple:
      return generateTupleParser(new Pointer(model, ancestors))
    case ParserModelType.TupleElement:
    case ParserModelType.ArrayElement:
      return generateParserFromModel(model.parser, [...ancestors, model])
    case ParserModelType.Union:
      return generateUnionParser(new Pointer(model, ancestors))
    case ParserModelType.Intersection:
      return generateIntersectionParser(new Pointer(model, ancestors))
    case ParserModelType.Enum:
      return generateEnumParser(new Pointer(model, ancestors))
    case ParserModelType.Reference:
      return generateReferenceParser(new Pointer(model, ancestors))
    case ParserModelType.Date:
      return generateDateParser(new Pointer(model, ancestors))
    case ParserModelType.Any:
      return generateAnyParser(new Pointer(model, ancestors))
    case ParserModelType.TypeParameter:
      return generateTypeParameterParser(new Pointer(model, ancestors))
  }
}
