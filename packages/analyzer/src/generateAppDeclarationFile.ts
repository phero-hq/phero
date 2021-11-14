import { readFileSync } from "fs"
import ts, { nodeModuleNameResolver } from "typescript"
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
  console.debug("Start generating declaration file")
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
                generateFunction(func, typeChecker),
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
    // Reads the "es2015" lib files
    return originalReadFile(fileName)
  }
  host.fileExists = (fileName: string) => {
    return !!xfiles[fileName]
  }

  // // Prepare and emit the d.ts files
  const program = ts.createProgram(["api.ts"], opts, host)
  const emitResult = program.emit()

  const t2 = Date.now()
  console.debug(`Done generating declaration file in ${t2 - t1}`)

  console.log(ts.formatDiagnostics(emitResult.diagnostics, formatHost))
  console.log("errors", emitResult.diagnostics.length)

  console.log("==== api.ts ====")
  console.log(xfiles["api.ts"])
  console.log("==== api.d.ts ====")
  console.log(xfiles["api.d.ts"])
}

function generateFunction(
  func: ParsedSamenFunctionDefinition,
  typeChecker: ts.TypeChecker,
): ts.FunctionDeclaration {
  // const type = typeChecker
  //   .getSignatureFromDeclaration(func.func)
  //   ?.getReturnType()

  // const typeNode =
  //   type && typeChecker.typeToTypeNode(type, undefined, undefined)

  return ts.factory.createFunctionDeclaration(
    undefined, // TODO decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // TODO asteriks is prohibited
    func.name,
    undefined, // TODO typeParameters are prohibited
    func.func.parameters,
    unwrapPromise(func.func.type),
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

function unwrapPromise(
  typeNode: ts.TypeNode | undefined,
): ts.TypeNode | undefined {
  if (typeNode && ts.isTypeReferenceNode(typeNode)) {
    const promisedType = typeNode.typeArguments?.[0]
    if (typeNode.typeName.getText() === "Promise" && promisedType) {
      const cleanedPromisedType = cleanQualiedName(promisedType)
      return ts.factory.createTypeReferenceNode(
        typeNode.typeName,
        cleanedPromisedType ? [cleanedPromisedType] : [],
      )
    }
  }
  return typeNode
}

function cleanQualiedName(
  typeNode: ts.TypeNode | undefined,
): ts.TypeNode | undefined {
  if (
    typeNode &&
    ts.isTypeReferenceNode(typeNode) &&
    ts.isQualifiedName(typeNode.typeName)
  ) {
    return ts.factory.createTypeReferenceNode(
      typeNode.typeName.right,
      typeNode.typeArguments
        ?.map(cleanQualiedName)
        .filter((a): a is ts.TypeNode => a !== undefined),
    )
  }
  return typeNode
}

function generateModels(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
): ts.Statement[] {
  type Model =
    | ts.InterfaceDeclaration
    | ts.TypeAliasDeclaration
    | ts.EnumDeclaration // add more types of models
  const models: Model[] = []
  const addedSymbols: ts.Symbol[] = []

  const funcs: ts.FunctionDeclaration[] = app.services
    .flatMap((s) => s.funcs)
    .flatMap((f) => f.func)

  const params: ts.ParameterDeclaration[] = funcs.flatMap((f) => f.parameters)
  for (const param of params) {
    doType(param.type)
  }

  for (const func of funcs) {
    doType(func.type)
  }

  function doType(typeNode: ts.TypeNode | undefined, log = false): void {
    // console.log("declaration", typeNode?.getText())
    if (!typeNode) {
      return
    } else if (ts.isTypeReferenceNode(typeNode)) {
      // console.log("doing", typeNode.typeName.getText())
      for (const typeArgument of typeNode.typeArguments ?? []) {
        // console.log("func.type", typeArgument.kind, typeArgument.getText())
        doType(typeArgument)
      }

      const type = typeChecker.getTypeFromTypeNode(typeNode)
      const symbol = type.aliasSymbol ?? type.symbol
      // console.log("git symbol", symbol.name)
      if (addedSymbols.includes(symbol)) {
        return
      }
      // console.log("addedSymbols", symbol.name)
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
    } else {
      // console.log("other typeNode", typeNode.kind, typeNode.getText())
    }
  }

  function doDeclaration(declaration: ts.Declaration | undefined): void {
    // console.log("declaration", declaration?.getText())
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
    } else {
      // console.log("declr kind", declaration.kind)
    }
  }

  return models
}
