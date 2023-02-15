import ts from "typescript"
import { ParseError } from "../../../domain/errors"
import { ParserModel, ParserModelType } from "../../ParserModel"

export default function generateFromLiteralTypeNode(
  typeNode: ts.LiteralTypeNode,
  typeChecker: ts.TypeChecker,
): ParserModel {
  switch (typeNode.literal.kind) {
    case ts.SyntaxKind.NullKeyword:
      return { type: ParserModelType.Null }
    case ts.SyntaxKind.TrueKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: true }
    case ts.SyntaxKind.FalseKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: false }
    case ts.SyntaxKind.StringLiteral: {
      const stringType = typeChecker.getTypeAtLocation(
        typeNode,
      ) as ts.StringLiteralType
      return {
        type: ParserModelType.StringLiteral,
        literal: stringType.value,
      }
    }
    case ts.SyntaxKind.NumericLiteral: {
      const numberType = typeChecker.getTypeAtLocation(
        typeNode,
      ) as ts.NumberLiteralType
      return {
        type: ParserModelType.NumberLiteral,
        literal: numberType.value,
      }
    }
    case ts.SyntaxKind.BigIntLiteral: {
      const bigIntType = typeChecker.getTypeAtLocation(
        typeNode,
      ) as ts.BigIntLiteralType
      return {
        type: ParserModelType.BigIntLiteral,
        literal: bigIntType.value,
      }
    }
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.JsxAttributes:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PrefixUnaryExpression:
    default:
      throw new ParseError(
        `Literal ${typeNode.literal.kind} not implemented`,
        typeNode,
      )
  }
}
