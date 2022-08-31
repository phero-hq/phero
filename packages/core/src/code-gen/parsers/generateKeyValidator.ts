import ts from "typescript"
import { ParseError } from "../../errors"
import { ParserModel, ParserModelType } from "./generateParserModel"
import { generateStringValidator } from "./generateStringParser"
import Pointer from "./Pointer"

export function generateKeyValidator(
  model: ParserModel,
  keyName: ts.Identifier,
): ts.Expression {
  if (model.type === ParserModelType.String) {
    return generateStringValidator(
      new Pointer(model, [
        {
          type: ParserModelType.Root,
          name: keyName.text,
          parser: model,
        },
      ]),
    )
  }

  if (model.type === ParserModelType.Number) {
    return ts.factory.createCallExpression(
      ts.factory.createIdentifier("isNaN"),
      undefined,
      [
        ts.factory.createCallExpression(
          ts.factory.createIdentifier("parseInt"),
          undefined,
          [keyName, ts.factory.createNumericLiteral("10")],
        ),
      ],
    )
  }

  if (model.type === ParserModelType.Union) {
    const literalExprs: ts.LiteralExpression[] = model.oneOf.reduce(
      (result, element) =>
        element.type === ParserModelType.StringLiteral
          ? [...result, ts.factory.createStringLiteral(element.literal)]
          : element.type === ParserModelType.NumberLiteral
          ? [...result, ts.factory.createNumericLiteral(element.literal)]
          : result,
      [] as ts.LiteralExpression[],
    )

    return ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createArrayLiteralExpression(literalExprs, false),
          ts.factory.createIdentifier("includes"),
        ),
        undefined,
        [keyName],
      ),
    )
  }

  throw new ParseError(
    `S140: Key parser type "${model.type}" not implemented`,
    keyName,
  )
}
