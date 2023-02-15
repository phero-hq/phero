import ts from "typescript"
import { EnumParserModel, ParserModelType } from "../../domain/ParserModel"
import generateFromEnumMemberDeclaration from "./generateFromEnumMemberDeclaration"

export default function generateFromEnumDeclaration(
  enumDeclr: ts.EnumDeclaration,
  typeChecker: ts.TypeChecker,
): EnumParserModel {
  return {
    type: ParserModelType.Enum,
    name: enumDeclr.name.text,
    members: enumDeclr.members.map((member) =>
      generateFromEnumMemberDeclaration(member, typeChecker),
    ),
  }
}
