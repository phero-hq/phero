import ts from "typescript"
import {
  generateFunction,
  generateModel,
  generateNamespace,
  ReferenceMaker,
} from "./code-gen-lib"
import { ParsedSamenApp } from "./parseSamenApp"
import { VirtualCompilerHost } from "./VirtualCompilerHost"

export default function generateAppDeclarationFile(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
): string {
  const t1 = Date.now()

  const domainIdentifier = ts.factory.createIdentifier("domain")
  const versionIdentifier = ts.factory.createIdentifier("v_1_0_0")

  const refMaker = new ReferenceMaker(
    app.models,
    typeChecker,
    ts.factory.createQualifiedName(domainIdentifier, versionIdentifier),
    undefined,
  )

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
            generateModel(m, refMaker),
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
            generateModel(m, refMaker),
          ),
          // export function myFunction(): Promise<void> {
          ...service.funcs.map((func) => generateFunction(func, refMaker)),
        ]),
      ]),
    )
  }

  const vHost = new VirtualCompilerHost({
    emitDeclarationOnly: true,
  })

  // console.log("---123----")
  // console.log(generateTS(namespaceDeclrs))
  // console.log("---123----")
  vHost.addFile("api.ts", generateTS(namespaceDeclrs))

  const program = vHost.createProgram("api.ts")
  program.emit()

  // console.log("ssss", program.getSemanticDiagnostics().length)
  // console.log("ssss", program.getSemanticDiagnostics()[0].messageText)
  // console.log("ssss", program.getSemanticDiagnostics()[1].messageText)

  const t2 = Date.now()
  // console.log("generateAppDeclarationFile in", t2 - t1)

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
