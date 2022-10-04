import ts from "typescript"
import { isExternalDeclaration, isExternalSymbol } from "../tsUtils"
import { Model, ParsedSamenFunctionDefinition } from "./parseSamenApp"

const IGNORE_SYNTAX_KIND = [
  ts.SyntaxKind.StringKeyword,
  ts.SyntaxKind.BooleanKeyword,
  ts.SyntaxKind.NumberKeyword,
  ts.SyntaxKind.LiteralType,
  ts.SyntaxKind.ImportSpecifier,
  ts.SyntaxKind.VoidKeyword,
  ts.SyntaxKind.AnyKeyword,
  ts.SyntaxKind.UndefinedKeyword,
]

export default function parseModels(
  funcs: ParsedSamenFunctionDefinition[],
  typeChecker: ts.TypeChecker,
): Model[] {
  const models: Model[] = []
  const addedSymbols: ts.Symbol[] = []

  for (const param of funcs.flatMap((func) => func.parameters)) {
    doType(param.type)
  }

  for (const returnType of funcs.flatMap((func) => func.returnType)) {
    doType(returnType)
  }

  function doType(typeNode: ts.TypeNode | undefined): void {
    if (!typeNode) {
      return
    }

    if (ts.isTypeReferenceNode(typeNode)) {
      for (const typeArgument of typeNode.typeArguments ?? []) {
        doType(typeArgument)
      }

      // this is the best way to get the actual declaration of a TypeReferenceNode
      // this works for interfaces and type aliases
      const symbol = typeChecker.getSymbolAtLocation(typeNode.typeName)

      if (!symbol || isExternalSymbol(symbol)) {
        return
      }

      addedSymbols.push(symbol)

      for (const declaration of symbol.declarations ?? []) {
        doDeclaration(declaration)
      }

      if ((symbol.flags & ts.SymbolFlags.Alias) === ts.SymbolFlags.Alias) {
        const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
        if (aliasSymbol && !addedSymbols.includes(aliasSymbol)) {
          addedSymbols.push(aliasSymbol)
          for (const d of aliasSymbol.declarations ?? []) {
            doDeclaration(d)
          }
        }
      }
    } else if (ts.isTypeLiteralNode(typeNode)) {
      doMembers(typeNode.members)
    } else if (ts.isUnionTypeNode(typeNode)) {
      for (const unionElementType of typeNode.types) {
        doType(unionElementType)
      }
    } else if (ts.isIntersectionTypeNode(typeNode)) {
      for (const intersectionElementType of typeNode.types) {
        doType(intersectionElementType)
      }
    } else if (ts.isArrayTypeNode(typeNode)) {
      doType(typeNode.elementType)
    } else if (ts.isExpressionWithTypeArguments(typeNode)) {
      const extendedType = typeChecker.getTypeFromTypeNode(typeNode)
      for (const declr of extendedType.symbol.declarations ?? []) {
        doDeclaration(declr)
      }
    } else if (ts.isIndexedAccessTypeNode(typeNode)) {
      doType(typeNode.objectType)
      doType(typeNode.indexType)
    } else if (ts.isTupleTypeNode(typeNode)) {
      for (const el of typeNode.elements) {
        doType(el)
      }
    } else if (ts.isParenthesizedTypeNode(typeNode)) {
      doType(typeNode.type)
    } else if (!IGNORE_SYNTAX_KIND.includes(typeNode.kind)) {
      console.warn("Model extracting not possible for node " + typeNode.kind)
    }
  }

  function doDeclaration(declaration: ts.Declaration | undefined): void {
    if (!declaration) {
      return
    }
    if (isExternalDeclaration(declaration)) {
      return
    }

    if (ts.isInterfaceDeclaration(declaration)) {
      doMembers(declaration.members)
      for (const heritageClause of declaration.heritageClauses ?? []) {
        for (const type of heritageClause.types) {
          doType(type)
        }
      }
      for (const typeParam of declaration.typeParameters ?? []) {
        doDeclaration(typeParam)
      }

      models.push(declaration)
    } else if (ts.isTypeAliasDeclaration(declaration)) {
      doType(declaration.type)

      for (const typeParam of declaration.typeParameters ?? []) {
        doDeclaration(typeParam)
      }

      models.push(declaration)
    } else if (ts.isEnumDeclaration(declaration)) {
      models.push(declaration)
    } else if (ts.isEnumMember(declaration)) {
      doDeclaration(declaration.parent)
    } else if (ts.isTypeParameterDeclaration(declaration)) {
      doType(declaration.constraint)
      doType(declaration.default)
    } else if (ts.isTypeLiteralNode(declaration)) {
      doMembers(declaration.members)
    } else if (!IGNORE_SYNTAX_KIND.includes(declaration.kind)) {
      console.warn(
        "Model extracting not possible for declaration " + declaration.kind,
      )
    }
  }

  function doMembers(members: ts.NodeArray<ts.TypeElement>): void {
    for (const member of members) {
      if (ts.isPropertySignature(member)) {
        doType(member.type)
      } else if (ts.isIndexSignatureDeclaration(member)) {
        // TODO name, but could be computed property
        doType(member.type)
      }
    }
  }

  return models
}
