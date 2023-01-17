import ts from "typescript"
import { ParseError } from "../domain/errors"
import { printCode } from "../lib/tsTestUtils"

export default function isConditionalType(
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  typeChecker: ts.TypeChecker,
): boolean {
  return check(declaration)

  function check(node: ts.Node): boolean {
    if (ts.isTypeAliasDeclaration(node)) {
      // console.log("isTypeAliasDeclaration", printCode(node))
      return check(node.type)
    }
    if (ts.isInterfaceDeclaration(node)) {
      return node.members.some(check)
    }
    if (ts.isEnumDeclaration(node)) {
      return false
    }
    if (ts.isEnumMember(node)) {
      return false
    }
    if (ts.isConditionalTypeNode(node)) {
      return true
    }
    if (ts.isTypeLiteralNode(node)) {
      return node.members.some(check)
    }
    if (ts.isPropertySignature(node) || ts.isIndexSignatureDeclaration(node)) {
      if (!node.type) {
        throw new ParseError("Member must have type", node)
      }
      return check(node.type)
    }
    if (ts.isTupleTypeNode(node)) {
      return node.elements.some(check)
    }
    if (ts.isArrayTypeNode(node)) {
      return check(node.elementType)
    }
    if (ts.isTypeParameterDeclaration(node)) {
      // console.log("XXX", node.default?.kind)
      return !!node.constraint || (node.default ? check(node.default) : false) // || !!node.default // TODO default ook?
    }
    if (ts.isTypeReferenceNode(node)) {
      // console.log("isTypeReferenceNode", printCode(node))
      const s = typeChecker.getSymbolAtLocation(node.typeName)
      const x = s?.declarations?.some(check) ?? false

      const y = s?.declarations?.every(allTypeParametersHaveDefaults)

      if (!x || (!node.typeArguments && !y)) {
        return x
      }

      return (
        !!node.typeArguments &&
        node.typeArguments.some((ta) => {
          if (ts.isTypeReferenceNode(ta)) {
            const tas = typeChecker.getSymbolAtLocation(ta.typeName)
            if (tas && tas.flags & ts.SymbolFlags.TypeParameter) {
              return true
            }
          }
          return false
        })
      )
    }
    if (ts.isLiteralTypeNode(node) || ts.isToken(node)) {
      return false
    }
    if (ts.isIntersectionTypeNode(node)) {
      return node.types.some(check)
    }
    if (ts.isUnionTypeNode(node)) {
      return node.types.some(check)
    }
    if (ts.isParenthesizedTypeNode(node)) {
      return check(node.type)
    }

    throw new ParseError("Not implemented", node)
  }
}

function allTypeParametersHaveDefaults(
  // typeRefNode: ts.TypeReferenceNode,
  declaration: ts.Declaration,
): boolean {
  if (
    !ts.isInterfaceDeclaration(declaration) &&
    !ts.isTypeAliasDeclaration(declaration)
  ) {
    return false
  }

  if (!declaration.typeParameters) {
    return false
  }

  return declaration.typeParameters.every(
    (tp) => !tp.default || !ts.isConditionalTypeNode(tp.default),
  )
}
