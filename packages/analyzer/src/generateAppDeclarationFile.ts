import { readFileSync } from "fs"
import ts, { nodeModuleNameResolver } from "typescript"
import { ParsedSamenApp, ParsedSamenFunctionDefinition } from "./parseSamenApp"
import { resolveSymbol } from "./tsUtils"

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
  const type = typeChecker
    .getSignatureFromDeclaration(func.func)
    ?.getReturnType()

  const typeNode =
    type && typeChecker.typeToTypeNode(type, undefined, undefined)

  return ts.factory.createFunctionDeclaration(
    undefined, // TODO decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // TODO asteriks is prohibited
    func.name,
    undefined, // TODO typeParameters are prohibited
    func.func.parameters,
    typeNode,
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
    const returnType = typeChecker
      .getSignatureFromDeclaration(func)
      ?.getReturnType()

    if (returnType?.symbol.name !== "Promise") {
      // ReturnType should always be wrapped with Promise
      continue
    }

    if (returnType) {
      const returnTypeNode = typeChecker.typeToTypeNode(
        returnType,
        func,
        undefined,
      )
      console.log(func.name, returnTypeNode?.getChildAt(0))
      // if (returnTypeNode && ts.isTypeReferenceNode(returnTypeNode)) {
      //   console.log("returnTypeNode", returnType.symbol.name)
      //   // returnTypeNode.getChildAt(0)
      //   // doType(returnTypeNode)
      // }
    }
  }

  function doType(typeNode: ts.TypeNode | undefined, log = false): void {
    if (!typeNode) {
      return
    } else if (ts.isTypeReferenceNode(typeNode)) {
      console.log("typeNode.typeArguments", typeNode.typeArguments)
      for (const typeArgument of typeNode.typeArguments ?? []) {
        doType(typeArgument)
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
      // console.log("TYPE LITERAL", typeNode.getText())
      for (const member of typeNode.members) {
        if (ts.isPropertySignature(member)) {
          // console.log("TYPE", member.type?.kind, member.name.getText())
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

      // console.log("par", typeNode.parent.getText())
    }

    // else if (ts.isQualifiedName(typeNode)) {
    //   console.log("QUALIFIED NAME")
    // } else if (ts.isPropertySignature(typeNode)) {
    //   console.log("PROP SIG")
    // }
    // else {
    //   ts.isStringLiteralLike()
    //   console.log("ELSEEEE", typeNode.kind)
    //   // console.log(typeNode)

    //   // typeChecker.getSym
    //   if (ts.isPropertySignature(typeNode.parent)) {
    //     // console.log("is stringggg", typeNode.parent)
    //     console.log("PROPPSPPP", typeNode.parent.type)
    //   }
    // }
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
    } else {
      console.log("declr kind", declaration.kind)
    }
  }

  return models
}
