import { readFileSync } from "fs"
import ts from "typescript"
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
  const serviceNamespaceDeclrs = generateNamespace(
    // export namespace service {
    "services",
    app.services.map((service) =>
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
    lib: ["lib.es2015.d.ts"],
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

  console.log(xfiles)
}

function generateFunction(
  func: ParsedSamenFunctionDefinition,
  typeChecker: ts.TypeChecker,
) {
  const type = typeChecker
    .getSignatureFromDeclaration(func.func)
    ?.getReturnType()
  const typeNode =
    type && typeChecker.typeToTypeNode(type, undefined, undefined)

  return ts.factory.createFunctionDeclaration(
    undefined,
    [exportModifier, asyncModifier],
    undefined,
    func.name,
    func.func.typeParameters,
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
