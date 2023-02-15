import ts from "typescript"
import { ParseError } from "../../domain/errors"
import { ParserModel, ParserModelType } from "../../domain/ParserModel"

export default function generateFromTokenTypeNode(
  typeNode: ts.TypeNode,
): ParserModel {
  switch (typeNode.kind) {
    case ts.SyntaxKind.AnyKeyword:
      return { type: ParserModelType.Any }
    case ts.SyntaxKind.BigIntKeyword:
      return { type: ParserModelType.BigInt }
    case ts.SyntaxKind.BooleanKeyword:
      return { type: ParserModelType.Boolean }
    case ts.SyntaxKind.FalseKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: false }
    case ts.SyntaxKind.NullKeyword:
      return { type: ParserModelType.Null }
    case ts.SyntaxKind.NumberKeyword:
      return { type: ParserModelType.Number }
    case ts.SyntaxKind.StringKeyword:
      return { type: ParserModelType.String }
    case ts.SyntaxKind.TrueKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: true }
    case ts.SyntaxKind.UndefinedKeyword:
      return { type: ParserModelType.Undefined }
    case ts.SyntaxKind.UnknownKeyword:
      return { type: ParserModelType.Any }
    case ts.SyntaxKind.VoidKeyword:
      return { type: ParserModelType.Undefined }

    case ts.SyntaxKind.ObjectKeyword:
    case ts.SyntaxKind.SymbolKeyword:
    // TODO
    default:
      throw new ParseError(
        `TokenKind ${typeNode.kind} not implemented`,
        typeNode,
      )
  }
}
