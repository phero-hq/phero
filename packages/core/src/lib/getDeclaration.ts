import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import { printCode } from "./tsTestUtils"

export default function getDeclaration(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): { symbol: ts.Symbol; declaration: ts.Declaration } {
  const symbol = typeChecker.getSymbolAtLocation(
    ts.isTypeReferenceNode(node)
      ? node.typeName
      : ts.isExpressionWithTypeArguments(node)
      ? node.expression
      : node,
  )
  if (!symbol) {
    throw new PheroParseError("Entity must have symbol" + printCode(node), node)
  }

  if ((symbol.flags & ts.SymbolFlags.Alias) === ts.SymbolFlags.Alias) {
    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
    if (aliasSymbol?.declarations?.[0]) {
      return {
        symbol: aliasSymbol,
        declaration: aliasSymbol.declarations?.[0],
      }
    }
  }

  const declaration = symbol?.declarations?.[0]
  if (!declaration) {
    throw new PheroParseError(
      "Entity must have declaration" + printCode(node),
      node,
    )
  }

  return { symbol, declaration }
}
