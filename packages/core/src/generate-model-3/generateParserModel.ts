import ts from "typescript"
import { ParseError } from "../domain/errors"
import {
  IndexMemberParserModel,
  MemberParserModel,
  ParserModel,
  ParserModelType,
} from "../generate-model-2/ParserModel"

export interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

export function generateParserModel(
  func: ts.FunctionDeclaration,
  prog: ts.Program,
): ParserModelMap {
  const typeChecker = prog.getTypeChecker()

  const funcType = func.type

  if (!funcType) {
    throw new ParseError("Function must have type", func)
  }

  return { root: generate(funcType, typeChecker) as any, deps: {} }
}

function generate(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
): ParserModel {
  if (ts.isTokenKind(typeNode.kind)) {
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
      // TODO?
      default:
        throw new Error(`TokenKind ${typeNode.kind} not implemented`)
    }
  }

  if (ts.isLiteralTypeNode(typeNode)) {
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
        throw new Error(`Literal ${typeNode.literal.kind} not implemented`)
    }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    return {
      type: ParserModelType.Array,
      element: {
        type: ParserModelType.ArrayElement,
        parser: generate(typeNode.elementType, typeChecker),
      },
    }
  }

  if (ts.isUnionTypeNode(typeNode)) {
    return {
      type: ParserModelType.Union,
      oneOf: typeNode.types.map((type) => generate(type, typeChecker)),
    }
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    return {
      type: ParserModelType.Intersection,
      parsers: typeNode.types.map((type) => generate(type, typeChecker)),
    }
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return generate(typeNode.type, typeChecker)
  }

  if (ts.isTupleTypeNode(typeNode)) {
    return {
      type: ParserModelType.Tuple,
      elements: typeNode.elements.map((element, position) => ({
        type: ParserModelType.TupleElement,
        position,
        parser: generate(element, typeChecker),
      })),
    }
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    return {
      type: ParserModelType.Object,
      members: typeNode.members.reduce<
        (MemberParserModel | IndexMemberParserModel)[]
      >((members, member) => {
        if (ts.isPropertySignature(member)) {
          if (!member.type) {
            throw new ParseError("Member must have a type", member)
          }
          return [
            ...members,
            {
              type: ParserModelType.Member,
              name: getMemberNameAsString(member),
              optional: !!member.questionToken,
              parser: generate(member.type, typeChecker),
            },
          ]
        } else if (ts.isIndexSignatureDeclaration(member)) {
          if (!member.type) {
            throw new ParseError("Member must have a type", member)
          }
          // TODO IndexMember
        }

        return members
      }, []),
    }
  }

  throw new ParseError("not implemented", typeNode)
}

function getMemberNameAsString(member: ts.TypeElement): string {
  const memberName = member.name

  if (!memberName) {
    throw new ParseError("Member has no name", member)
  }

  if (ts.isIdentifier(memberName)) {
    return memberName.text
  }
  if (ts.isStringLiteral(memberName)) {
    return memberName.text
  }
  if (ts.isNumericLiteral(memberName)) {
    return memberName.text
  }
  if (ts.isComputedPropertyName(memberName)) {
    throw new ParseError(
      "Member name must not be computed property",
      memberName,
    )
  }

  if (ts.isPrivateIdentifier(memberName)) {
    throw new ParseError(
      "Member name must not be private identifier",
      memberName,
    )
  }

  throw new ParseError(`Unexpected value for member name`, memberName)
}
