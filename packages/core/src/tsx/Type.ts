import ts from "typescript"
import { typeReference } from "./typeReference"

export class Type {
  public static get any(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
  }

  public static get unknown(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
  }

  public static get boolean(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
  }

  public static get string(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
  }

  public static get number(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
  }

  public static get undefined(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
  }

  public static get void(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
  }

  public static get never(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
  }

  public static array(elementType: ts.TypeNode): ts.ArrayTypeNode {
    return ts.factory.createArrayTypeNode(elementType)
  }

  public static union(...types: ts.TypeNode[]): ts.UnionTypeNode {
    return ts.factory.createUnionTypeNode(types)
  }

  public static intersection(...types: ts.TypeNode[]): ts.IntersectionTypeNode {
    return ts.factory.createIntersectionTypeNode(types)
  }

  public static literalType(
    literal:
      | ts.LiteralExpression
      | ts.NullLiteral
      | ts.BooleanLiteral
      | ts.PrefixUnaryExpression,
  ): ts.LiteralTypeNode {
    return ts.factory.createLiteralTypeNode(literal)
  }

  public static reference = typeReference

  public static function(props: {
    params: ts.ParameterDeclaration[]
    type: ts.TypeNode
    typeParams?: ts.TypeParameterDeclaration[]
  }): ts.FunctionTypeNode {
    return ts.factory.createFunctionTypeNode(
      props.typeParams,
      props.params,
      props.type,
    )
  }
}
