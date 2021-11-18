import ts, { createTypeQueryNode } from "typescript"
import { ParseError } from "./errors"
import { ParsedSamenApp, ParsedSamenFunctionDefinition } from "./parseSamenApp"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const asyncModifier = ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

function generateNamespace(
  name: string,
  body: ts.Statement[],
): ts.ModuleDeclaration {
  return ts.factory.createModuleDeclaration(
    undefined,
    [exportModifier],
    ts.factory.createIdentifier(name),
    ts.factory.createModuleBlock(body),
    ts.NodeFlags.Namespace,
  )
}

export default function generateAppDeclarationFile(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
) {
  const t1 = Date.now()

  const serviceNamespaceDeclrs = generateNamespace(
    // export namespace service {
    "services",
    [
      ...generateModels(app, typeChecker),
      ...app.services.map((service) =>
        // export namespace cmsService {
        generateNamespace(
          service.name,
          service.funcs.map((func) =>
            // export namespace editArticle {
            generateNamespace(func.name, [
              // export namespace v1 {
              generateNamespace("v1", [
                // generate Function declaration
                generateFunction(func),
              ]),
            ]),
          ),
        ),
      ),
    ],
  )

  const xfiles: { [fileName: string]: string } = {}

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

  const result = printer.printNode(
    ts.EmitHint.Unspecified,
    serviceNamespaceDeclrs,
    file,
  )

  xfiles["api.ts"] = result

  const opts: ts.CompilerOptions = {
    declaration: true,
    emitDeclarationOnly: true,
    // NOTE: we need Promise support in our declaration file. In a normal TS project you would add
    // the "es2015". Because we're implementing a file system here, sort of, we need to set the file
    // name more explicitly. (Implementing our own fileExists makes compilation much much faster.)
    lib: [
      // support for Promise
      "lib.es2015.d.ts",
      // support for Pick, Omit, and other TS utilities
      "lib.es5.d.ts",
    ],
  }
  const host = ts.createCompilerHost(opts)
  const originalReadFile = host.readFile

  host.writeFile = (fileName: string, contents: string) => {
    xfiles[fileName] = contents
  }
  host.readFile = (fileName: string) => {
    if (xfiles[fileName]) {
      return xfiles[fileName]
    }
    // Reads the lib files
    return originalReadFile(fileName)
  }
  host.fileExists = (fileName: string) => {
    return !!xfiles[fileName]
  }

  // // Prepare and emit the d.ts files
  const program = ts.createProgram(["api.ts"], opts, host)
  const emitResult = program.emit()

  const t2 = Date.now()
  console.log("parseSamenApp in", t2 - t1)

  console.log(ts.formatDiagnostics(emitResult.diagnostics, formatHost))
  console.log("errors", emitResult.diagnostics.length)

  console.log("==== api.ts ====")
  console.log(xfiles["api.ts"])
  console.log("==== api.d.ts ====")
  console.log(xfiles["api.d.ts"])
}

function generateFunction(
  func: ParsedSamenFunctionDefinition,
): ts.FunctionDeclaration {
  return ts.factory.createFunctionDeclaration(
    undefined, // TODO decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // TODO asteriks is prohibited
    func.name,
    undefined, // TODO typeParameters are prohibited
    // func.parameters,
    func.parameters.map((p) =>
      ts.factory.createParameterDeclaration(
        undefined,
        p.modifiers,
        p.dotDotDotToken,
        p.name,
        p.questionToken,
        p.type && generateTypeNode(p.type),
        undefined, // initializer is prohibited, only on classes
      ),
    ),
    generateTypeNode(func.returnType),
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

type Model =
  | ts.InterfaceDeclaration
  | ts.TypeAliasDeclaration
  | ts.EnumDeclaration // add more types of models

function generateModelDeclaration(model: Model): Model {
  if (ts.isTypeAliasDeclaration(model)) {
    return ts.factory.createTypeAliasDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint),
          tp.default && generateTypeNode(tp.default),
        ),
      ),
      generateTypeNode(model.type),
    )
  } else if (ts.isInterfaceDeclaration(model)) {
    return ts.factory.createInterfaceDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint),
          tp.default && generateTypeNode(tp.default),
        ),
      ),
      model.heritageClauses?.map((hc) =>
        ts.factory.createHeritageClause(
          hc.token,
          hc.types.map((t) =>
            ts.factory.createExpressionWithTypeArguments(
              t.expression,
              t.typeArguments?.map(generateTypeNode),
            ),
          ),
        ),
      ),
      model.members.map(generateTypeElement),
    )
  }

  return model
}

function generateTypeElement(typeElement: ts.TypeElement): ts.TypeElement {
  if (ts.isPropertySignature(typeElement)) {
    return ts.factory.createPropertySignature(
      typeElement.modifiers,
      typeElement.name,
      typeElement.questionToken,
      typeElement.type && generateTypeNode(typeElement.type),
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
          p.type && generateTypeNode(p.type),
          p.initializer,
        ),
      ),
      generateTypeNode(typeElement.type),
    )
  }

  throw new ParseError(
    "Only Property signature is allowed " + typeElement.kind,
    typeElement,
  )
}

function generateTypeNode(type: ts.TypeNode, indent = 0): ts.TypeNode {
  let indentString = ""
  for (let ind = 0; ind < indent; ind++) {
    indentString += " "
  }

  if (ts.isTypeReferenceNode(type)) {
    return ts.factory.createTypeReferenceNode(
      type.typeName,
      type.typeArguments?.map((ta) => generateTypeNode(ta, indent + 4)),
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
      type.types.map((t) => generateTypeNode(t, indent + 4)),
    )
  }
  if (ts.isIntersectionTypeNode(type)) {
    return ts.factory.createIntersectionTypeNode(
      type.types.map((t) => generateTypeNode(t, indent + 4)),
    )
  }

  if (ts.isTypeLiteralNode(type)) {
    return ts.factory.createTypeLiteralNode(
      type.members.map(generateTypeElement),
    )
  }

  return type
}

function generateModels(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
): ts.Statement[] {
  const models: Model[] = []
  const addedSymbols: ts.Symbol[] = []

  const funcs: ParsedSamenFunctionDefinition[] = app.services.flatMap(
    (s) => s.funcs,
  )

  const params: ts.ParameterDeclaration[] = funcs.flatMap((f) => f.parameters)
  for (const param of params) {
    doType(param.type)
  }

  const returnTypes: ts.TypeNode[] = funcs.map((f) => f.returnType)
  for (const returnType of returnTypes) {
    if (
      // returnType itself is a Promise
      ts.isTypeReferenceNode(returnType) &&
      returnType.typeName.getText() === "Promise"
    ) {
      for (const typeArg of returnType.typeArguments ?? []) {
        doType(typeArg)
      }
    } else {
      throw new ParseError(
        "Return type should be of type Promise<T>",
        returnType,
      )
    }
  }

  function doType(typeNode: ts.TypeNode | undefined): void {
    if (!typeNode) {
      return
    } else if (ts.isTypeReferenceNode(typeNode)) {
      for (const typeArgument of typeNode.typeArguments ?? []) {
        doType(typeArgument)
      }

      if (
        typeNode.typeName
          .getSourceFile()
          .fileName.includes("node_modules/typescript/lib/lib.")
      ) {
        return
      }

      const type = typeChecker.getTypeFromTypeNode(typeNode)
      const symbol = type.aliasSymbol ?? type.symbol

      if (addedSymbols.includes(symbol)) {
        return
      }

      addedSymbols.push(symbol)

      for (const declaration of symbol.declarations ?? []) {
        const declarationFileName = declaration.getSourceFile().fileName

        // prevent that we include TS lib types
        if (declarationFileName.includes("node_modules/typescript/lib/lib.")) {
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

      models.push(
        ts.factory.createInterfaceDeclaration(
          undefined, // TODO warn about removing
          [exportModifier],
          declaration.name,
          declaration.typeParameters,
          declaration.heritageClauses,
          declaration.members,
        ),
      )
    } else if (ts.isTypeAliasDeclaration(declaration)) {
      doType(declaration.type)

      for (const typeParam of declaration.typeParameters ?? []) {
        doDeclaration(typeParam)
      }

      models.push(
        ts.factory.createTypeAliasDeclaration(
          undefined, // TODO warn about removing
          [exportModifier],
          declaration.name,
          declaration.typeParameters,
          declaration.type,
        ),
      )
    } else if (ts.isEnumDeclaration(declaration)) {
      models.push(
        ts.factory.createEnumDeclaration(
          undefined, // TODO warn about removing
          [exportModifier],
          declaration.name,
          declaration.members,
        ),
      )
    } else if (ts.isEnumMember(declaration)) {
      doDeclaration(declaration.parent)
    } else if (ts.isTypeParameterDeclaration(declaration)) {
      doType(declaration.constraint)
      doType(declaration.default)
    }
  }

  return models.map(generateModelDeclaration)
}
