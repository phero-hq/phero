import ts from "typescript"
import { binaryExpression } from "./binaryExpression"
import { arrowFunction } from "./arrowFunction"

export class Expression {
  public static await(expression: ts.Expression): ts.AwaitExpression {
    return ts.factory.createAwaitExpression(expression)
  }

  public static binary = binaryExpression

  public static propertyAccess(
    obj: string,
    prop: string,
    ...deepProps: string[]
  ): ts.PropertyAccessExpression {
    function create(left: ts.Expression, right: string) {
      return ts.factory.createPropertyAccessExpression(left, right)
    }
    return deepProps.reduce(
      create,
      create(ts.factory.createIdentifier(obj), prop),
    )
  }

  public static call(
    name: string | ts.Expression,
    opts?: { args?: (string | ts.Expression)[] },
  ): ts.CallExpression {
    return ts.factory.createCallExpression(
      typeof name == "string" ? ts.factory.createIdentifier(name) : name,
      undefined,
      opts?.args?.map((arg) =>
        typeof arg === "string" ? ts.factory.createIdentifier(arg) : arg,
      ),
    )
  }

  public static arrowFunction = arrowFunction

  public static literalType(literal: ts.LiteralExpression): ts.LiteralTypeNode {
    return ts.factory.createLiteralTypeNode(literal)
  }
}
