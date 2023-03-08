import ts from "typescript"

import { type Model } from "../domain/PheroApp"

export function isModel(node: ts.Node): node is Model {
  return (
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node)
  )
}
