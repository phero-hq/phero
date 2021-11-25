import ts from "typescript"
import { ParseError } from "./errors"
import {
  Model,
  ParsedSamenApp,
  ParsedSamenFunctionDefinition,
} from "./parseSamenApp"
import { VirtualCompilerHost } from "./VirtualCompilerHost"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const asyncModifier = ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)

function generateNamespace(
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

export default function generateAppDeclarationFile(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
): string {
  const t1 = Date.now()

  const domainIdentifier = ts.factory.createIdentifier("domain")
  const versionIdentifier = ts.factory.createIdentifier("v_1_0_0")

  const sharedTypes = app.models.map((m) => typeChecker.getTypeAtLocation(m))

  const namespaceDeclrs: ts.ModuleDeclaration[] = []

  if (app.models.length) {
    namespaceDeclrs.push(
      // export namespace domain {
      generateNamespace(domainIdentifier, [
        // export namespace v_1_0_0 {
        generateNamespace(
          versionIdentifier,
          app.models.map((m) =>
            // export interface MyModel {
            generateModelDeclaration(
              m,
              sharedTypes,
              typeChecker,
              versionIdentifier,
            ),
          ),
        ),
      ]),
    )
  }

  for (const service of app.services) {
    namespaceDeclrs.push(
      // export namespace cmsService {
      generateNamespace(ts.factory.createIdentifier(service.name), [
        // export namespace v_1_0_0 {
        generateNamespace(versionIdentifier, [
          ...service.models.map((m) =>
            // export interface MyModel {
            generateModelDeclaration(
              m,
              sharedTypes,
              typeChecker,
              versionIdentifier,
            ),
          ),
          // export function myFunction(): Promise<void> {
          ...service.funcs.map((func) =>
            generateFunction(func, sharedTypes, typeChecker, versionIdentifier),
          ),
        ]),
      ]),
    )
  }

  const vHost = new VirtualCompilerHost({
    emitDeclarationOnly: true,
  })

  vHost.addFile("api.ts", generateTS(namespaceDeclrs))

  const program = vHost.createProgram("api.ts")
  program.emit()

  const t2 = Date.now()
  console.log("generateAppDeclarationFile in", t2 - t1)

  const declrFile = vHost.getFile("api.d.ts")

  if (!declrFile) {
    throw new Error("Can't generate app declaration file")
  }

  return declrFile
}

function generateTS(nodes: ts.Node[]): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const file = ts.createSourceFile(
    "api.ts",
    "",
    ts.ScriptTarget.ES5,
    false,
    ts.ScriptKind.TS,
  )

  return printer.printList(
    ts.ListFormat.SourceFileStatements,
    ts.factory.createNodeArray(nodes),
    file,
  )
}

function generateFunction(
  func: ParsedSamenFunctionDefinition,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
  versionIdentifier: ts.Identifier,
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
        p.type &&
          generateTypeNode(p.type, sharedTypes, typeChecker, versionIdentifier),
        undefined, // initializer is prohibited, only on classes
      ),
    ),
    ts.factory.createTypeReferenceNode("Promise", [
      generateTypeNode(
        func.returnType,
        sharedTypes,
        typeChecker,
        versionIdentifier,
      ),
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

function generateModelDeclaration(
  model: Model,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
  versionIdentifier: ts.Identifier,
): Model {
  if (ts.isTypeAliasDeclaration(model)) {
    return ts.factory.createTypeAliasDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint &&
            generateTypeNode(
              tp.constraint,
              sharedTypes,
              typeChecker,
              versionIdentifier,
            ),
          tp.default &&
            generateTypeNode(
              tp.default,
              sharedTypes,
              typeChecker,
              versionIdentifier,
            ),
        ),
      ),
      generateTypeNode(model.type, sharedTypes, typeChecker, versionIdentifier),
    )
  } else if (ts.isInterfaceDeclaration(model)) {
    return ts.factory.createInterfaceDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint &&
            generateTypeNode(
              tp.constraint,
              sharedTypes,
              typeChecker,
              versionIdentifier,
            ),
          tp.default &&
            generateTypeNode(
              tp.default,
              sharedTypes,
              typeChecker,
              versionIdentifier,
            ),
        ),
      ),
      model.heritageClauses?.map((hc) =>
        ts.factory.createHeritageClause(
          hc.token,
          hc.types.map((t) =>
            ts.factory.createExpressionWithTypeArguments(
              t.expression,
              t.typeArguments?.map((t) =>
                generateTypeNode(
                  t,
                  sharedTypes,
                  typeChecker,
                  versionIdentifier,
                ),
              ),
            ),
          ),
        ),
      ),
      model.members.map((m) =>
        generateTypeElement(m, sharedTypes, typeChecker, versionIdentifier),
      ),
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
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
  versionIdentifier: ts.Identifier,
): ts.TypeElement {
  if (ts.isPropertySignature(typeElement)) {
    return ts.factory.createPropertySignature(
      typeElement.modifiers,
      typeElement.name,
      typeElement.questionToken,
      typeElement.type &&
        generateTypeNode(
          typeElement.type,
          sharedTypes,
          typeChecker,
          versionIdentifier,
        ),
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
          p.type &&
            generateTypeNode(
              p.type,
              sharedTypes,
              typeChecker,
              versionIdentifier,
            ),
          p.initializer,
        ),
      ),
      generateTypeNode(
        typeElement.type,
        sharedTypes,
        typeChecker,
        versionIdentifier,
      ),
    )
  }

  throw new ParseError(
    "Only Property signature is allowed " + typeElement.kind,
    typeElement,
  )
}

function generateTypeNode(
  type: ts.TypeNode,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
  versionIdentifier: ts.Identifier,
): ts.TypeNode {
  if (ts.isTypeReferenceNode(type)) {
    return ts.factory.createTypeReferenceNode(
      withNamespace(type, sharedTypes, typeChecker, versionIdentifier),
      type.typeArguments?.map((t) =>
        generateTypeNode(t, sharedTypes, typeChecker, versionIdentifier),
      ),
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
      type.types.map((t) =>
        generateTypeNode(t, sharedTypes, typeChecker, versionIdentifier),
      ),
    )
  }
  if (ts.isIntersectionTypeNode(type)) {
    return ts.factory.createIntersectionTypeNode(
      type.types.map((t) =>
        generateTypeNode(t, sharedTypes, typeChecker, versionIdentifier),
      ),
    )
  }

  if (ts.isTypeLiteralNode(type)) {
    return ts.factory.createTypeLiteralNode(
      type.members.map((m) =>
        generateTypeElement(m, sharedTypes, typeChecker, versionIdentifier),
      ),
    )
  }

  if (ts.isArrayTypeNode(type)) {
    return ts.factory.createArrayTypeNode(
      generateTypeNode(
        type.elementType,
        sharedTypes,
        typeChecker,
        versionIdentifier,
      ),
    )
  }

  if (ts.isIndexedAccessTypeNode(type)) {
    return ts.factory.createIndexedAccessTypeNode(
      generateTypeNode(
        type.objectType,
        sharedTypes,
        typeChecker,
        versionIdentifier,
      ),
      generateTypeNode(
        type.indexType,
        sharedTypes,
        typeChecker,
        versionIdentifier,
      ),
    )
  }

  return type
}

function withNamespace(
  typeNode: ts.TypeReferenceNode,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
  versionIdentifier: ts.Identifier,
): ts.EntityName {
  const type = typeChecker.getTypeFromTypeNode(typeNode)
  const isSharedType = sharedTypes.some(
    (st) => (st.symbol ?? st.aliasSymbol) === (type.symbol ?? type.aliasSymbol),
  )

  const modelName = cleanTypeName(typeNode.typeName, typeChecker)

  if (isSharedType) {
    return withDomainEntity(modelName)
  }

  if ((type.flags & ts.TypeFlags.EnumLiteral) === ts.TypeFlags.EnumLiteral) {
    const theEnum = typeChecker.getBaseTypeOfLiteralType(type)
    if (sharedTypes.some((st) => st.symbol === theEnum.symbol)) {
      return withDomainEntity(modelName)
    }
  }

  return modelName

  function withDomainEntity(name: ts.EntityName) {
    return concatEntityNames(
      ts.factory.createQualifiedName(
        ts.factory.createIdentifier("domain"),
        versionIdentifier,
      ),
      name,
      typeChecker,
    )
  }
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
  tc: ts.TypeChecker,
): ts.EntityName {
  if (ts.isIdentifier(right)) {
    return ts.factory.createQualifiedName(left, right)
  }

  return ts.factory.createQualifiedName(
    concatEntityNames(left, right.left, tc),
    right.right,
  )
}
