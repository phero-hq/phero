import ts from "typescript"
import { getNameAsString, isExternal, isExternalSymbol } from "../tsUtils"
import {
  Model,
  PheroFunction,
  PheroMiddlewareConfig,
  PheroModel,
} from "./domain"

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

export function parseMiddlewareModels(
  middlewareConfigs: PheroMiddlewareConfig[],
  prog: ts.Program,
): PheroModel[] {
  const modelParser = new ModelParser(prog)

  for (const config of middlewareConfigs) {
    modelParser.doType(config.contextType)
    modelParser.doType(config.nextType)
    modelParser.doType(config.paramsType)
  }

  return modelParser.models.map((m) => ({
    name: getNameAsString(m.name),
    ref: m,
  }))
}

export function parseFunctionModels(
  func: PheroFunction,
  prog: ts.Program,
): PheroModel[] {
  const modelParser = new ModelParser(prog)

  for (const param of func.parameters) {
    modelParser.doType(param.type)
  }

  modelParser.doType(func.returnType)

  return modelParser.models.map((m) => ({
    name: getNameAsString(m.name),
    ref: m,
  }))
}

class ModelParser {
  public readonly models: Model[] = []
  private readonly addedSymbols: ts.Symbol[] = []
  private readonly typeChecker: ts.TypeChecker

  constructor(private readonly prog: ts.Program) {
    this.typeChecker = prog.getTypeChecker()
  }

  doType(typeNode: ts.TypeNode | undefined): void {
    if (!typeNode) {
      return
    }

    if (ts.isTypeReferenceNode(typeNode)) {
      for (const typeArgument of typeNode.typeArguments ?? []) {
        this.doType(typeArgument)
      }

      // this is the best way to get the actual declaration of a TypeReferenceNode
      // this works for interfaces and type aliases
      const symbol = this.typeChecker.getSymbolAtLocation(typeNode.typeName)

      if (!symbol || isExternalSymbol(symbol, this.prog)) {
        return
      }

      this.addedSymbols.push(symbol)

      for (const declaration of symbol.declarations ?? []) {
        this.doDeclaration(declaration)
      }

      if ((symbol.flags & ts.SymbolFlags.Alias) === ts.SymbolFlags.Alias) {
        const aliasSymbol = this.typeChecker.getAliasedSymbol(symbol)
        if (aliasSymbol && !this.addedSymbols.includes(aliasSymbol)) {
          this.addedSymbols.push(aliasSymbol)
          for (const d of aliasSymbol.declarations ?? []) {
            this.doDeclaration(d)
          }
        }
      }
    } else if (ts.isTypeLiteralNode(typeNode)) {
      this.doMembers(typeNode.members)
    } else if (ts.isUnionTypeNode(typeNode)) {
      for (const unionElementType of typeNode.types) {
        this.doType(unionElementType)
      }
    } else if (ts.isIntersectionTypeNode(typeNode)) {
      for (const intersectionElementType of typeNode.types) {
        this.doType(intersectionElementType)
      }
    } else if (ts.isArrayTypeNode(typeNode)) {
      this.doType(typeNode.elementType)
    } else if (ts.isExpressionWithTypeArguments(typeNode)) {
      const extendedType = this.typeChecker.getTypeFromTypeNode(typeNode)
      for (const declr of extendedType.symbol.declarations ?? []) {
        this.doDeclaration(declr)
      }
    } else if (ts.isIndexedAccessTypeNode(typeNode)) {
      this.doType(typeNode.objectType)
      this.doType(typeNode.indexType)
    } else if (ts.isTupleTypeNode(typeNode)) {
      for (const el of typeNode.elements) {
        this.doType(el)
      }
    } else if (ts.isParenthesizedTypeNode(typeNode)) {
      this.doType(typeNode.type)
    } else if (!IGNORE_SYNTAX_KIND.includes(typeNode.kind)) {
      console.warn("Model extracting not possible for node " + typeNode.kind)
    }
  }

  doDeclaration(declaration: ts.Declaration | undefined): void {
    if (!declaration) {
      return
    }
    if (isExternal(declaration, this.prog)) {
      return
    }

    if (ts.isInterfaceDeclaration(declaration)) {
      this.doMembers(declaration.members)
      for (const heritageClause of declaration.heritageClauses ?? []) {
        for (const type of heritageClause.types) {
          this.doType(type)
        }
      }
      for (const typeParam of declaration.typeParameters ?? []) {
        this.doDeclaration(typeParam)
      }

      this.models.push(declaration)
    } else if (ts.isTypeAliasDeclaration(declaration)) {
      this.doType(declaration.type)

      for (const typeParam of declaration.typeParameters ?? []) {
        this.doDeclaration(typeParam)
      }

      this.models.push(declaration)
    } else if (ts.isEnumDeclaration(declaration)) {
      this.models.push(declaration)
    } else if (ts.isEnumMember(declaration)) {
      this.doDeclaration(declaration.parent)
    } else if (ts.isTypeParameterDeclaration(declaration)) {
      this.doType(declaration.constraint)
      this.doType(declaration.default)
    } else if (ts.isTypeLiteralNode(declaration)) {
      this.doMembers(declaration.members)
    } else if (!IGNORE_SYNTAX_KIND.includes(declaration.kind)) {
      console.warn(
        "Model extracting not possible for declaration " + declaration.kind,
      )
    }
  }

  doMembers(members: ts.NodeArray<ts.TypeElement>): void {
    for (const member of members) {
      if (ts.isPropertySignature(member)) {
        this.doType(member.type)
      } else if (ts.isIndexSignatureDeclaration(member)) {
        // TODO name, but could be computed property
        this.doType(member.type)
      }
    }
  }
}
