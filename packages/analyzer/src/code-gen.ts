import ts from "typescript"
import { ParseError } from "./errors"
import { getReturnType } from "./extractFunctionFromServiceProperty"
import { ParsedServiceDeclaration } from "./parseAppDeclaration"
import { Model, ParsedSamenFunctionDefinition } from "./parseSamenApp"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const asyncModifier = ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)

export function generateNamespace(
  name: ts.Identifier,
  body: ts.Statement[],
): ts.ModuleDeclaration {
  return ts.factory.createModuleDeclaration(
    undefined,
    [exportModifier],
    name,
    ts.factory.createModuleBlock(body),
    ts.NodeFlags.Namespace,
  )
}

export function generateFunction(
  func: ParsedSamenFunctionDefinition,
  makeRef: (typeNode: ts.TypeReferenceNode) => ts.EntityName,
): ts.FunctionDeclaration {
  return ts.factory.createFunctionDeclaration(
    undefined, // TODO decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // TODO asteriks is prohibited
    func.name,
    undefined, // TODO typeParameters are prohibited
    func.parameters.map((p) =>
      ts.factory.createParameterDeclaration(
        undefined,
        p.modifiers,
        p.dotDotDotToken,
        p.name,
        p.questionToken,
        p.type && generateTypeNode(p.type, makeRef),
        undefined, // initializer is prohibited, only on classes
      ),
    ),
    ts.factory.createTypeReferenceNode("Promise", [
      generateTypeNode(func.returnType, makeRef),
    ]),
    ts.factory.createBlock([
      ts.factory.createThrowStatement(
        ts.factory.createNewExpression(
          ts.factory.createIdentifier("Error"),
          undefined,
          [ts.factory.createStringLiteral("no impl", false)],
        ),
      ),
    ]),
  )
}

export function generateClientFunction(
  func: ts.FunctionDeclaration,
  makeRef: (typeNode: ts.TypeReferenceNode) => ts.EntityName,
): ts.PropertyAssignment {
  return ts.factory.createPropertyAssignment(
    func.name!,
    ts.factory.createArrowFunction(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      func.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          undefined,
          p.modifiers,
          p.dotDotDotToken,
          p.name,
          p.questionToken,
          p.type && generateTypeNode(p.type, makeRef),
          undefined, // initializer is prohibited, only on classes
        ),
      ),
      func.type && generateTypeNode(func.type, makeRef),
      undefined,
      // ts.factory.createBlock([], false),
      generateClientFunctionBlock(func, makeRef),
    ),
  )
}

function generateClientFunctionBlock(
  func: ts.FunctionDeclaration,
  makeRef: (typeNode: ts.TypeReferenceNode) => ts.EntityName,
): ts.Block {
  // TODO should not use getReturnType or refactor
  const returnType = getReturnType(func)
  const isVoid = returnType.kind === ts.SyntaxKind.VoidKeyword

  return ts.factory.createBlock([
    ts.factory.createReturnStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createThis(),
          isVoid
            ? ts.factory.createIdentifier("requestVoid")
            : ts.factory.createIdentifier("request"),
        ),
        isVoid ? undefined : [generateTypeNode(returnType, makeRef)], //typeArgs,
        [
          ts.factory.createStringLiteral(func.name!.getText()),
          ts.factory.createObjectLiteralExpression(
            func.parameters.map((p, index) => {
              if (ts.isIdentifier(p.name)) {
                return ts.factory.createShorthandPropertyAssignment(
                  ts.factory.createIdentifier(p.name.getText()),
                )
              }
              // TODO https://trello.com/c/UJHzzAHz/25-support-object-array-binding-patterns-in-parameter-names
              throw new Error("No support for prop binding names yet")
            }),
            true,
          ),
        ], // argumentArray
      ),
    ),
  ])
}

export function generateModel(
  model: Model,
  makeRef: (typeNode: ts.TypeReferenceNode) => ts.EntityName,
): Model {
  if (ts.isTypeAliasDeclaration(model)) {
    return ts.factory.createTypeAliasDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint, makeRef),
          tp.default && generateTypeNode(tp.default, makeRef),
        ),
      ),
      generateTypeNode(model.type, makeRef),
    )
  } else if (ts.isInterfaceDeclaration(model)) {
    return ts.factory.createInterfaceDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint, makeRef),
          tp.default && generateTypeNode(tp.default, makeRef),
        ),
      ),
      model.heritageClauses?.map((hc) =>
        ts.factory.createHeritageClause(
          hc.token,
          hc.types.map((t) =>
            ts.factory.createExpressionWithTypeArguments(
              t.expression,
              t.typeArguments?.map((t) => generateTypeNode(t, makeRef)),
            ),
          ),
        ),
      ),
      model.members.map((m) => generateTypeElement(m, makeRef)),
    )
  } else if (ts.isEnumDeclaration(model)) {
    return ts.factory.createEnumDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.members.map((member) => {
        return ts.factory.createEnumMember(
          generatePropertyName(member.name),
          member.initializer &&
            (ts.isStringLiteral(member.initializer)
              ? ts.factory.createStringLiteral(member.initializer.text)
              : ts.isNumericLiteral(member.initializer)
              ? ts.factory.createNumericLiteral(member.initializer.text)
              : undefined),
        )
      }),
    )
  }

  return model
}

function generatePropertyName(propName: ts.PropertyName): ts.PropertyName {
  if (ts.isIdentifier(propName)) {
    return ts.factory.createIdentifier(propName.text)
  } else if (ts.isStringLiteral(propName)) {
    return ts.factory.createStringLiteral(propName.text)
  } else if (ts.isNumericLiteral(propName)) {
    return ts.factory.createNumericLiteral(propName.text)
  }
  // else if (ts.isComputedPropertyName(propName)) {
  // } else if (ts.isPrivateIdentifier(propName)) {
  // }
  throw new ParseError(
    "Must be identifier, stringliteral or numericliteral",
    propName,
  )
}

function generateTypeElement(
  typeElement: ts.TypeElement,
  makeRef: (typeNode: ts.TypeReferenceNode) => ts.EntityName,
): ts.TypeElement {
  if (ts.isPropertySignature(typeElement)) {
    return ts.factory.createPropertySignature(
      typeElement.modifiers,
      typeElement.name,
      typeElement.questionToken,
      typeElement.type && generateTypeNode(typeElement.type, makeRef),
    )
  }

  if (ts.isIndexSignatureDeclaration(typeElement)) {
    return ts.factory.createIndexSignature(
      undefined,
      typeElement.modifiers,
      typeElement.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          undefined,
          p.modifiers,
          p.dotDotDotToken,
          p.name,
          p.questionToken,
          p.type && generateTypeNode(p.type, makeRef),
          p.initializer,
        ),
      ),
      generateTypeNode(typeElement.type, makeRef),
    )
  }

  throw new ParseError(
    "Only Property signature is allowed " + typeElement.kind,
    typeElement,
  )
}

function generateTypeNode(
  type: ts.TypeNode,
  makeRef: (typeNode: ts.TypeReferenceNode) => ts.EntityName,
): ts.TypeNode {
  if (ts.isTypeReferenceNode(type)) {
    return ts.factory.createTypeReferenceNode(
      makeRef(type),
      type.typeArguments?.map((t) => generateTypeNode(t, makeRef)),
    )
  }
  if (ts.isLiteralTypeNode(type)) {
    if (ts.isStringLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createStringLiteral(type.literal.text),
      )
    } else if (ts.isNumericLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createNumericLiteral(type.literal.text),
      )
    }
  }
  if (ts.isUnionTypeNode(type)) {
    return ts.factory.createUnionTypeNode(
      type.types.map((t) => generateTypeNode(t, makeRef)),
    )
  }
  if (ts.isIntersectionTypeNode(type)) {
    return ts.factory.createIntersectionTypeNode(
      type.types.map((t) => generateTypeNode(t, makeRef)),
    )
  }

  if (ts.isTypeLiteralNode(type)) {
    return ts.factory.createTypeLiteralNode(
      type.members.map((m) => generateTypeElement(m, makeRef)),
    )
  }

  if (ts.isArrayTypeNode(type)) {
    return ts.factory.createArrayTypeNode(
      generateTypeNode(type.elementType, makeRef),
    )
  }

  if (ts.isIndexedAccessTypeNode(type)) {
    return ts.factory.createIndexedAccessTypeNode(
      generateTypeNode(type.objectType, makeRef),
      generateTypeNode(type.indexType, makeRef),
    )
  }

  return type
}

function cleanTypeName(
  tn: ts.EntityName,
  typeChecker: ts.TypeChecker,
): ts.EntityName {
  if (ts.isIdentifier(tn)) {
    return tn
  }

  const symbol = typeChecker.getSymbolAtLocation(tn)

  if (
    !symbol ||
    (symbol.flags & ts.SymbolFlags.EnumMember) !== ts.SymbolFlags.EnumMember
  ) {
    return tn.right
  }

  if (ts.isIdentifier(tn.left)) {
    return tn
  }

  return ts.factory.createQualifiedName(
    tn.left.right, // Enum
    tn.right, // EnumMember
  )
}

function concatEntityNames(
  left: ts.EntityName,
  right: ts.EntityName,
): ts.EntityName {
  if (ts.isIdentifier(right)) {
    return ts.factory.createQualifiedName(left, right)
  }

  return ts.factory.createQualifiedName(
    concatEntityNames(left, right.left),
    right.right,
  )
}

export function makeReference(
  domain: Model[],
  typeChecker: ts.TypeChecker,
  sharedDomainName: ts.EntityName | undefined,
  serviceDomainName: ts.EntityName | undefined,
): (typeNode: ts.TypeReferenceNode) => ts.EntityName {
  const sharedTypes = domain.map((m) => typeChecker.getTypeAtLocation(m))

  return (typeNode: ts.TypeReferenceNode): ts.EntityName => {
    const type = typeChecker.getTypeFromTypeNode(typeNode)
    const isSharedType = sharedTypes.some(
      (st) =>
        (st.symbol ?? st.aliasSymbol) === (type.symbol ?? type.aliasSymbol),
    )

    const modelName = cleanTypeName(typeNode.typeName, typeChecker)

    const isExternalType = type
      .getSymbol()
      ?.declarations?.some((d) =>
        d.getSourceFile().fileName.includes("node_modules/typescript/lib/lib."),
      )

    if (isExternalType) {
      return modelName
    }
    if (isSharedType) {
      return withDomainEntity(modelName)
    }

    if ((type.flags & ts.TypeFlags.EnumLiteral) === ts.TypeFlags.EnumLiteral) {
      const theEnum = typeChecker.getBaseTypeOfLiteralType(type)
      if (sharedTypes.some((st) => st.symbol === theEnum.symbol)) {
        return withDomainEntity(modelName)
      }
    }

    return serviceDomainName
      ? concatEntityNames(serviceDomainName, modelName)
      : modelName

    function withDomainEntity(name: ts.EntityName) {
      return sharedDomainName ? concatEntityNames(sharedDomainName, name) : name
    }
  }
}
