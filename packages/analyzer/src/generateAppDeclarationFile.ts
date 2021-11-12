import ts from "typescript"
import { ParsedSamenApp, ParsedSamenFunctionDefinition } from "./parseSamenApp"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)

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
    ts.ScriptTarget.ESNext,
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
  }
  const host = ts.createCompilerHost(opts)

  host.writeFile = (fileName: string, contents: string) => {
    xfiles[fileName] = contents
  }
  host.readFile = (fileName: string) => xfiles[fileName]
  host.fileExists = (fileName: string) => !!xfiles[fileName]

  // // Prepare and emit the d.ts files
  const program = ts.createProgram(["api.ts"], opts, host)
  program.emit()

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
    [exportModifier],
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
