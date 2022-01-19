import ts from "typescript"
import { Model, ParsedSamenFunctionDefinition } from "./parseSamenApp"
import { isExternalDeclaration, isExternalTypeNode } from "./tsUtils"

export default function extractModels(
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
    } else if (ts.isTypeReferenceNode(typeNode)) {
      for (const typeArgument of typeNode.typeArguments ?? []) {
        doType(typeArgument)
      }

      if (isExternalTypeNode(typeNode)) {
        return
      }

      const type = typeChecker.getTypeFromTypeNode(typeNode)
      const symbol = type.aliasSymbol ?? type.symbol

      if (addedSymbols.includes(symbol)) {
        return
      }

      addedSymbols.push(symbol)

      for (const declaration of symbol.declarations ?? []) {
        // prevent that we include TS lib types
        if (isExternalDeclaration(declaration)) {
          declaration
          continue
        }

        doDeclaration(declaration)
      }
    } else if (ts.isTypeLiteralNode(typeNode)) {
      for (const member of typeNode.members) {
        if (ts.isPropertySignature(member)) {
          doType(member.type)
        }
      }
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
    }
  }

  function doDeclaration(declaration: ts.Declaration | undefined): void {
    if (!declaration) {
      return
    }

    if (ts.isInterfaceDeclaration(declaration)) {
      for (const member of declaration.members) {
        if (ts.isPropertySignature(member)) {
          doType(member.type)
        }
      }
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
    }
  }

  return models
}
