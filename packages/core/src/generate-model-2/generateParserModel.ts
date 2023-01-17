import ts from "typescript"
import { printCode } from "../lib/tsTestUtils"
import {
  getInferedReturnTypeOfFunction,
  getTypeFlags,
  hasTypeFlag,
  getTypeNames,
  getSymbolFlags,
} from "./generateParserModelUtils"
import {
  BooleanParserModel,
  EnumParserModel,
  ParserModel,
  ParserModelType,
  UnionParserModel,
} from "./ParserModel"

export default function generateParserModel(
  func: ts.FunctionDeclaration,
  prog: ts.Program,
): ParserModelMap {
  const typeChecker = prog.getTypeChecker()

  const returnTypeType = getInferedReturnTypeOfFunction(func, typeChecker)
  const generator = new ModelGenerator(prog)
  const rootParser = generator.generate(returnTypeType.type)
  return {
    root: rootParser,
    deps: [...generator.symbolParsers].reduce<Record<string, ParserModel>>(
      (result, [sym, parserModel]) => ({ ...result, [sym.name]: parserModel }),
      {},
    ),
  }
}

interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

class ModelGenerator {
  private readonly typeChecker: ts.TypeChecker
  public readonly symbolParsers: Map<ts.Symbol, ParserModel>

  constructor(private readonly prog: ts.Program) {
    this.typeChecker = prog.getTypeChecker()
    this.symbolParsers = new Map<ts.Symbol, ParserModel>()
  }

  public generate(type: ts.Type, resolveReference = false): ParserModel {
    const typeNode = this.typeChecker.typeToTypeNode(
      type,
      undefined,
      ts.NodeBuilderFlags.NoTypeReduction,
    )

    console.log("GEN", {
      typeNode: typeNode && printCode(typeNode),
      typeFlags: getTypeFlags(type),
      typeNames: getTypeNames(type),
      symbol: type.symbol && getSymbolFlags(type.symbol),
      aliasSymbol: type.aliasSymbol && getSymbolFlags(type.aliasSymbol),
    })

    if (!typeNode) {
      throw new Error("TypeNode expected")
    }

    if (type.isStringLiteral()) {
      return {
        type: ParserModelType.StringLiteral,
        literal: type.value,
      }
    } else if (type.isNumberLiteral()) {
      return {
        type: ParserModelType.NumberLiteral,
        literal: type.value,
      }
    } else if (type.flags === ts.TypeFlags.BooleanLiteral) {
      if (!ts.isLiteralTypeNode(typeNode)) {
        throw new Error("BooleanLiteral type has no LiteralTypeNode")
      }
      const isTrue = typeNode.literal.kind === ts.SyntaxKind.TrueKeyword
      return {
        type: ParserModelType.BooleanLiteral,
        literal: isTrue,
      }
    } else if (ts.isLiteralTypeNode(typeNode)) {
      switch (typeNode.literal.kind) {
        case ts.SyntaxKind.UndefinedKeyword:
          return { type: ParserModelType.Undefined }
        case ts.SyntaxKind.NullKeyword:
          return { type: ParserModelType.Null }
      }
    }

    if (type.flags === ts.TypeFlags.String) {
      return {
        type: ParserModelType.String,
      }
    }
    if (type.flags === ts.TypeFlags.Number) {
      return {
        type: ParserModelType.Number,
      }
    } else if (hasTypeFlag(type, ts.TypeFlags.Boolean)) {
      // boolean's are *also* unions of true|false literals
      return {
        type: ParserModelType.Boolean,
      }
    } else if (hasTypeFlag(type, ts.TypeFlags.Undefined)) {
      // NOTE: only works if strictNullChecks: true
      // https://stackoverflow.com/a/72839867/16759708
      return {
        type: ParserModelType.Undefined,
      }
    }

    if (type.symbol && this.symbolParsers.has(type.symbol)) {
      return {
        type: ParserModelType.Reference,
        typeName: type.symbol.name,
      }
    }

    if (type.aliasSymbol && !resolveReference) {
      this.symbolParsers.set(type.aliasSymbol, this.generate(type, true))

      // if (hasTypeFlag(type, ts.TypeFlags.EnumLiteral)) {
      //   return this.generateEnum(type)
      // }

      // const [aliasedSymbol, aliasedType] = this.getTypeOfReference(typeNode)
      // this.symbolParsers.set(aliasedSymbol, this.generate(aliasedType, true))
      // this.symbolParsers.set(type.aliasSymbol, this.generate(aliasedType, true))
      return {
        // type: ParserModelType.Id,
        // typeName: aliasedSymbol.name,
        type: ParserModelType.Reference,
        typeName: type.aliasSymbol.name,
      }
      // }

      // this.symbolParsers.set(type.aliasSymbol, this.generate(type, true))
      // return {
      //   type: ParserModelType.Reference,
      //   typeName: type.aliasSymbol.name,
      // }
    }

    // NOTE: union possibly has no symbol/aliasSymbol
    if (type.isUnion()) {
      // TODO super hacky!!!
      // maar dit is de manier om de origele te krijgen!!!
      // https://ts-ast-viewer.com/#code/FAFwngDgpgBAGgZhgXmDGAfGBvGBDALhgGcQAnASwDsBzGAXzUxxgCMiqBXAW1ajIZMs2JunQBjIqwD20gDZQ8VUYOBQAHhGlkQMAGacq4kBWlUYAfRpQQAVSqmqADgAUASiKJmiANoBdHCYQAAsyaQB3GCooSIBRMjCyd2BGIA
      const types = ((type as any)?.origin?.types as ts.Type[]) ?? type.types

      if (hasTypeFlag(type, ts.TypeFlags.EnumLiteral)) {
        return {
          type: ParserModelType.Enum,
          name: "TODO",
          members: types.map((enumType) => this.generate(enumType)) as any,
        }
      }

      // NOTE: type.types will expand union of unions
      return replaceBooleanLiteralsWithBooleanType({
        type: ParserModelType.Union,
        oneOf: types.map((unionElementType) => {
          return this.generate(unionElementType)
        }),
      })
    }

    if (type.symbol && type.symbol.name === "Array") {
      const arrayTypeArgs = this.typeChecker.getTypeArguments(
        type as ts.TypeReference,
      )
      const elementType = arrayTypeArgs[0]

      if (!elementType) {
        throw new Error("Array has no TypeElement")
      }

      return {
        type: ParserModelType.Array,
        element: {
          type: ParserModelType.ArrayElement,
          parser: this.generate(elementType),
        },
      }
    }

    if (hasTypeFlag(type, ts.TypeFlags.Object)) {
      if (ts.isArrayTypeNode(typeNode)) {
        const arrayTypeArgs = this.typeChecker.getTypeArguments(
          type as ts.TypeReference,
        )
        const elementType = arrayTypeArgs[0]

        if (!elementType) {
          throw new Error("Array has no TypeElement")
        }

        return {
          type: ParserModelType.Array,
          element: {
            type: ParserModelType.ArrayElement,
            parser: this.generate(elementType),
          },
        }
      }
    }

    if (type.isClassOrInterface() && !resolveReference) {
      this.symbolParsers.set(type.symbol, this.generate(type, true))

      return {
        type: ParserModelType.Reference,
        typeName: type.symbol.name,
      }
    }

    if (hasTypeFlag(type, ts.TypeFlags.Object)) {
      return {
        type: ParserModelType.Object,
        members: type.getProperties().map((propSymbol) => {
          const propType = this.typeChecker.getTypeOfSymbolAtLocation(
            propSymbol,
            propSymbol.declarations?.[0] as any,
          )

          const isOptional =
            (propSymbol.flags & ts.SymbolFlags.Optional) ===
            ts.SymbolFlags.Optional
          const memberParser = this.generate(propType)

          return {
            type: ParserModelType.Member,
            name: propSymbol.name,
            optional: isOptional,
            parser: isOptional
              ? removeUndefinedFromUnionParser(memberParser)
              : memberParser,
          }
        }),
      }
    }

    // symbols

    // console.log("typeNames", getTypeNames(type))
    // console.log("symbolFlags", type.symbol && getSymbolFlags(type.symbol))
    // console.log("typeFlags", getTypeFlags(type))
    // console.log("object", getObjectFlags(type.symbol.flags))

    throw new Error("Only literal " + getTypeFlags(type))
  }

  getTypeOfReference(typeNode: ts.TypeNode): [ts.Symbol, ts.Type] {
    if (ts.isTypeReferenceNode(typeNode)) {
      const typeRefSymbol = this.typeChecker.getSymbolAtLocation(
        typeNode.typeName,
      )

      if (typeRefSymbol) {
        return [
          typeRefSymbol,
          this.typeChecker.getDeclaredTypeOfSymbol(typeRefSymbol),
        ]
      }

      throw new Error("TypeNode has no symbol " + typeNode.kind)
    }

    throw new Error("TypeNode is not a TypeReferenceNode " + typeNode.kind)
  }

  generateEnum(type: ts.Type): EnumParserModel {
    return {
      type: ParserModelType.Enum,
      name: "TODO",
      members: (type as any).types.map((memberType: ts.Type) =>
        this.generate(memberType),
      ),
    }
  }
}

function replaceBooleanLiteralsWithBooleanType(
  union: UnionParserModel,
): ParserModel {
  const trueLiteral = union.oneOf.find(
    (p) => p.type === ParserModelType.BooleanLiteral && p.literal,
  )
  const falseLiteral = union.oneOf.find(
    (p) => p.type === ParserModelType.BooleanLiteral && !p.literal,
  )

  if (trueLiteral && falseLiteral) {
    const booleanParser: BooleanParserModel = {
      type: ParserModelType.Boolean,
    }
    if (union.oneOf.length === 2) {
      return booleanParser
    }
    return {
      type: ParserModelType.Union,
      oneOf: [
        ...union.oneOf.filter((p) => ![trueLiteral, falseLiteral].includes(p)),
        booleanParser,
      ],
    }
  }

  return union
}

function removeUndefinedFromUnionParser(parser: ParserModel): ParserModel {
  if (parser.type === ParserModelType.Union) {
    const undefinedParser = parser.oneOf.find(
      (p) => p.type === ParserModelType.Undefined,
    )
    if (undefinedParser) {
      const otherParsers = parser.oneOf.filter((p) => p !== undefinedParser)

      if (otherParsers.length === 1) {
        return otherParsers[0]
      }

      return {
        type: ParserModelType.Union,
        oneOf: otherParsers,
      }
    }
  }
  return parser
}
