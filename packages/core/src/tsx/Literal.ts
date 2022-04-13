import ts from "typescript"

export class Literal {
  public static get null(): ts.NullLiteral {
    return ts.factory.createNull()
  }

  public static get undefined(): ts.Identifier {
    return ts.factory.createIdentifier("undefined")
  }

  public static number(value: number): ts.NumericLiteral {
    return ts.factory.createNumericLiteral(value)
  }

  public static string(value: string): ts.StringLiteral {
    return ts.factory.createStringLiteral(value)
  }

  public static get true(): ts.TrueLiteral {
    return ts.factory.createTrue()
  }

  public static get false(): ts.FalseLiteral {
    return ts.factory.createFalse()
  }

  public static boolean(value: boolean): ts.BooleanLiteral {
    return value ? ts.factory.createTrue() : ts.factory.createFalse()
  }

  public static object(
    ...props: (
      | ts.PropertyAssignment
      | ts.ShorthandPropertyAssignment
      | ts.SpreadAssignment
    )[]
  ): ts.ObjectLiteralExpression {
    return ts.factory.createObjectLiteralExpression(props)
  }

  public static array(...elements: ts.Expression[]): ts.ArrayLiteralExpression {
    return ts.factory.createArrayLiteralExpression(elements)
  }

  public static type(...members: ts.PropertySignature[]): ts.TypeLiteralNode {
    return ts.factory.createTypeLiteralNode(members)
  }

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
