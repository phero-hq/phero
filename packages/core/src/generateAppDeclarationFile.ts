import ts from "typescript"
import {
  generateErrorClass,
  generateFunction,
  generateModel,
  generateNamespace,
  ReferenceMaker,
} from "./code-gen-lib"
import { ParsedPheroApp } from "./parsePheroApp"
import * as tsx from "./tsx"
import { VirtualCompilerHost } from "./VirtualCompilerHost"

export default function generateAppDeclarationFile(
  app: ParsedPheroApp,
  typeChecker: ts.TypeChecker,
): string {
  const domainIdentifier = ts.factory.createIdentifier("domain")
  const versionIdentifier = ts.factory.createIdentifier("v_1_0_0")

  const refMaker = new ReferenceMaker(
    app.models,
    typeChecker,
    ts.factory.createQualifiedName(domainIdentifier, versionIdentifier),
  )

  const namespaceDeclrs: ts.ModuleDeclaration[] = []

  if (app.models.length || app.errors.length) {
    namespaceDeclrs.push(
      // export namespace domain {
      generateNamespace(domainIdentifier, [
        // export namespace v_1_0_0 {
        generateNamespace(versionIdentifier, [
          ...app.models.map((m) =>
            // export interface MyModel {
            generateModel(m, refMaker),
          ),
          ...app.errors.map((e) =>
            // export class Error {
            generateErrorClass(e, refMaker),
          ),
        ]),
      ]),
    )
  }

  const isUsingPheroContext = app.services.some((s) => !!s.config.contextType)
  if (isUsingPheroContext) {
    namespaceDeclrs.push(
      generateNamespace(ts.factory.createIdentifier("phero"), [
        tsx.typeAlias({
          export: true,
          name: "PheroContext",
          typeParameters: [tsx.typeParam({ name: "T" })],
          type: tsx.type.reference({ name: "T" }),
        }),
      ]),
    )
  }

  for (const service of app.services) {
    namespaceDeclrs.push(
      // export namespace cmsService {
      generateNamespace(ts.factory.createIdentifier(service.name), [
        // export namespace v_1_0_0 {
        generateNamespace(versionIdentifier, [
          // export function myFunction(): Promise<void> {
          ...service.funcs.map((func) => generateFunction(func, refMaker)),
        ]),
      ]),
    )
  }

  const vHost = new VirtualCompilerHost({
    emitDeclarationOnly: true,
  })

  vHost.addFile("api.ts", generateTS(namespaceDeclrs))

  const program = vHost.createProgram("api.ts")
  const emitResult = program.emit()

  if (emitResult.diagnostics.length) {
    console.error("OOPS SOMETHING IS WRONG")
    console.error(generateTS(namespaceDeclrs))
    console.error(emitResult)
  }

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
