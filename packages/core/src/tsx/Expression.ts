import ts from "typescript"
import { binaryExpression } from "./binaryExpression"
import { arrowFunction } from "./arrowFunction"
import { prefixUnaryExpression } from "./prefixUnaryExpression"
import { postfixUnaryExpression } from "./postfixUnaryExpression"

export class Expression {
  public static await(expression: ts.Expression): ts.AwaitExpression {
    return ts.factory.createAwaitExpression(expression)
  }

  public static binary = binaryExpression
  public static prefixUnary = prefixUnaryExpression
  public static postfixUnary = postfixUnaryExpression

  public static negate(expression: ts.Expression): ts.PrefixUnaryExpression {
    return Expression.prefixUnary("!", expression)
  }

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

  public static identifier(text: string): ts.Identifier {
    return ts.factory.createIdentifier(text)
  }

  public static ternary(
    condition: ts.Expression,
    whenTrue: ts.Expression,
    whenFalse: ts.Expression,
  ): ts.ConditionalExpression {
    return ts.factory.createConditionalExpression(
      condition,
      ts.factory.createToken(ts.SyntaxKind.QuestionToken),
      whenTrue,
      ts.factory.createToken(ts.SyntaxKind.ColonToken),
      whenFalse,
    )
  }

  public static typeof(expression: ts.Expression): ts.TypeOfExpression {
    return ts.factory.createTypeOfExpression(expression)
  }

  public static parenthesis(
    expression: ts.Expression,
  ): ts.ParenthesizedExpression {
    return ts.factory.createParenthesizedExpression(expression)
  }

  public static new(
    expression: string | ts.Expression,
    props: {
      typeArgs?: ts.TypeNode[]
      args?: ts.Expression[]
    },
  ): ts.NewExpression {
    return ts.factory.createNewExpression(
      typeof expression === "string"
        ? ts.factory.createIdentifier(expression)
        : expression,
      props.typeArgs,
      props.args,
    )
  }
}
