import ts from "typescript"
import { PheroParseError } from "../domain/errors"

export default function parseReturnType(
  node: ts.FunctionLikeDeclarationBase | ts.MethodSignature,
): ts.TypeNode {
  const typeNode: ts.TypeNode | undefined = node.type

  if (!typeNode) {
    throw new PheroParseError(
      "S121: Return type should be explicitly defined",
      node,
    )
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const promisedType = typeNode.typeArguments?.[0]
    if (typeNode.typeName.getText() === "Promise" && promisedType) {
      return promisedType
    }
  }

  return typeNode
}
