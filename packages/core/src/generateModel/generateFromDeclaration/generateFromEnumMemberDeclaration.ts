import ts from "typescript"
import { PheroParseError } from "../../domain/errors"
import {
  EnumMemberParserModel,
  ParserModelType,
} from "../../domain/ParserModel"
import propertyNameAsString from "../lib/propertyNameAsString"

export default function generateFromEnumMemberDeclaration(
  member: ts.EnumMember,
  typeChecker: ts.TypeChecker,
): EnumMemberParserModel {
  // member.initializer

  const enumValueType = typeChecker.getTypeAtLocation(member)
  // const memberParser = generateFromType(enumValueType, undefined, typeChecker)
  if (
    // memberParser.type !== ParserModelType.NumberLiteral &&
    // memberParser.type !== ParserModelType.StringLiteral
    enumValueType.flags & ts.TypeFlags.StringLiteral
  ) {
    return {
      type: ParserModelType.EnumMember,
      name: propertyNameAsString(member.name),
      parser: {
        type: ParserModelType.StringLiteral,
        literal: (enumValueType as ts.StringLiteralType).value,
      },
    }
  }
  if (
    // memberParser.type !== ParserModelType.NumberLiteral &&
    // memberParser.type !== ParserModelType.StringLiteral
    enumValueType.flags & ts.TypeFlags.NumberLiteral
  ) {
    return {
      type: ParserModelType.EnumMember,
      name: propertyNameAsString(member.name),
      parser: {
        type: ParserModelType.NumberLiteral,
        literal: (enumValueType as ts.NumberLiteralType).value,
      },
    }
  }

  throw new PheroParseError(
    "Enum member should be either of type string or number",
    member,
  )
}
