import ts from "typescript"

export class Property {
  public static signature(
    name: string,
    type: ts.TypeNode,
    optional?: boolean,
  ): ts.PropertySignature {
    return ts.factory.createPropertySignature(
      undefined,
      name,
      optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      type,
    )
  }

  public static method(props: {
    name: string
    type: ts.TypeNode
    optional?: boolean
    params: ts.ParameterDeclaration[]
    typeParams?: ts.TypeParameterDeclaration[]
  }): ts.MethodSignature {
    return ts.factory.createMethodSignature(
      undefined,
      props.name,
      props.optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      props.typeParams,
      props.params,
      props.type,
    )
  }

  public static assignment(
    name: string | ts.PropertyName,
    init: ts.Expression,
  ): ts.PropertyAssignment {
    return ts.factory.createPropertyAssignment(name, init)
  }

  public static shorthandAssignment(
    name: string,
  ): ts.ShorthandPropertyAssignment {
    return ts.factory.createShorthandPropertyAssignment(name)
  }

  public static spreadAssignment(
    name: string | ts.Expression,
  ): ts.SpreadAssignment {
    return ts.factory.createSpreadAssignment(
      typeof name === "string" ? ts.factory.createIdentifier(name) : name,
    )
  }
}
