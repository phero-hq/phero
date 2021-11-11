import path from "path"
import { ts } from "ts-morph"
import { ParsedSamenApp } from "./parseSamenApp"

export namespace cmsService {
  export namespace getArticle {
    export namespace v1 {
      export function aad(y: number): string {
        throw new Error("")
      }
    }
  }
}

export default function generateAppDeclarationFile(app: ParsedSamenApp) {
  // const project = new Project({
  //   compilerOptions: {
  //     outDir: path.join(process.cwd(), "xxx"),
  //     declaration: true,
  //   },
  // })

  const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)

  const serviceNamespaceDeclrs = ts.factory.createModuleDeclaration(
    undefined,
    [exportModifier],
    ts.factory.createIdentifier("services"),
    ts.factory.createModuleBlock(
      app.services.map((service) => {
        const serviceNamespaceBlock = ts.factory.createModuleBlock(
          service.funcs.map((func) => {
            console.log(
              "func.func.compilerNode.type",
              func.func.compilerNode.type,
            )
            const funcNamespaceBlock = ts.factory.createModuleBlock([
              ts.factory.createModuleDeclaration(
                undefined,
                [exportModifier],
                ts.factory.createIdentifier("v1"),
                ts.factory.createModuleBlock([
                  ts.factory.createFunctionDeclaration(
                    undefined,
                    [exportModifier],
                    undefined,
                    func.name,
                    func.func.compilerNode.typeParameters,
                    func.func.compilerNode.parameters,
                    // func.func.compilerNode.type,
                    ts.factory.createKeywordTypeNode(
                      ts.SyntaxKind.NumberKeyword,
                    ),
                    // func.func.compilerNode.body,
                    ts.factory.createBlock([
                      ts.factory.createThrowStatement(
                        ts.factory.createNewExpression(
                          ts.factory.createIdentifier("Error"),
                          undefined,
                          [ts.factory.createStringLiteral("no impl", false)],
                        ),
                      ),
                    ]),
                  ),
                ]),
                ts.NodeFlags.Namespace,
              ),
            ])

            return ts.factory.createModuleDeclaration(
              undefined,
              [exportModifier],
              ts.factory.createIdentifier(func.name),
              funcNamespaceBlock,
              ts.NodeFlags.Namespace,
            )
          }),
        )

        return ts.factory.createModuleDeclaration(
          undefined,
          [exportModifier],
          ts.factory.createIdentifier(service.name),
          serviceNamespaceBlock,
          ts.NodeFlags.Namespace,
        )
      }),
    ),
    ts.NodeFlags.Namespace,
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
  // console.log("result", result)

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
