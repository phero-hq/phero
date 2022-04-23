import ts from "typescript"

export function simpleForOver({
  name,
  block,
}: {
  name: string | ts.Expression
  block: ts.Block | ts.Statement[]
}): ts.ForStatement {
  return ts.factory.createForStatement(
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("i"),
          undefined,
          undefined,
          ts.factory.createNumericLiteral("0"),
        ),
      ],
      ts.NodeFlags.Let,
    ),
    ts.factory.createBinaryExpression(
      ts.factory.createIdentifier("i"),
      ts.factory.createToken(ts.SyntaxKind.LessThanToken),
      ts.factory.createPropertyAccessExpression(
        typeof name == "string" ? ts.factory.createIdentifier(name) : name,
        ts.factory.createIdentifier("length"),
      ),
    ),
    ts.factory.createPostfixUnaryExpression(
      ts.factory.createIdentifier("i"),
      ts.SyntaxKind.PlusPlusToken,
    ),
    Array.isArray(block) ? ts.factory.createBlock(block) : block,
  )
}
