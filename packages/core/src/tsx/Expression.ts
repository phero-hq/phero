import ts from "typescript"
import { binaryExpression } from "./binaryExpression"
import { arrowFunction } from "./arrowFunction"

export class Expression {
  public static await(expression: ts.Expression): ts.AwaitExpression {
    return ts.factory.createAwaitExpression(expression)
  }

  public static binary = binaryExpression

  public static propertyAccess(
    obj: string | ts.Expression,
    prop: string,
    ...deepProps: string[]
  ): ts.PropertyAccessExpression {
    function create(left: ts.Expression, right: string) {
      return ts.factory.createPropertyAccessExpression(left, right)
    }
    return deepProps.reduce(
      create,
      create(
        typeof obj == "string" ? ts.factory.createIdentifier(obj) : obj,
        prop,
      ),
    )
  }

  public static elementAccess(
    arr: string | ts.Expression,
    index: string | number | ts.Expression,
  ): ts.ElementAccessExpression {
    return ts.factory.createElementAccessChain(
      typeof arr == "string" ? ts.factory.createIdentifier(arr) : arr,
      undefined,
      typeof index == "string" ? ts.factory.createIdentifier(index) : index,
    )
  }

  public static call(
    name: string | ts.Expression,
    opts?: { args?: (string | ts.Expression)[]; typeArgs?: ts.TypeNode[] },
  ): ts.CallExpression {
    return ts.factory.createCallExpression(
      typeof name == "string" ? ts.factory.createIdentifier(name) : name,
      opts?.typeArgs,
      opts?.args?.map((arg) =>
        typeof arg === "string" ? ts.factory.createIdentifier(arg) : arg,
      ),
    )
  }

  public static arrowFunction = arrowFunction

  public static literalType(literal: ts.LiteralExpression): ts.LiteralTypeNode {
    return ts.factory.createLiteralTypeNode(literal)
  }

  public static identifier(text: string): ts.Identifier {
    return ts.factory.createIdentifier(text)
  }
}
