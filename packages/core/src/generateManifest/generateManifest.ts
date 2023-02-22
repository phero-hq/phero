import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import { Model, PheroApp, PheroService } from "../domain/PheroApp"
import cloneTS from "../lib/cloneTS"
import { printCode } from "../lib/tsTestUtils"
import { hasModifier } from "../lib/tsUtils"
import * as tsx from "../tsx"
import generateErrorDeclaration from "./generateErrorDeclaration"
import generateFunctionDeclaration from "./generateFunctionDeclaration"

interface PheroManifest {
  content: string
}

export default function generateManifest(app: PheroApp): PheroManifest {
  return {
    content: printCode([
      ...app.models.map((model) => cloneTS(withExportModifier(model.ref))),
      ...app.errors.map(generateErrorDeclaration),
      ...generatePheroModels(app),
      ...app.services.map(generatePheroService),
    ]),
  }
}

function generatePheroModels(app: PheroApp): ts.Statement[] {
  const isUsingPheroContext = app.services.some((s) => !!s.config.contextType)

  if (!isUsingPheroContext) {
    return []
  }

  return [
    tsx.typeAlias({
      name: "PheroContext",
      export: true,
      typeParameters: [tsx.typeParam({ name: "T" })],
      type: tsx.type.reference({ name: "T" }),
    }),
  ]
}

function generatePheroService(service: PheroService): ts.ModuleDeclaration {
  return tsx.namespace({
    export: true,
    name: service.name,
    statements: service.funcs.map(generateFunctionDeclaration),
  })
}

function withExportModifier(ref: Model): Model {
  if (hasModifier(ref, ts.SyntaxKind.ExportKeyword)) {
    return ref
  }

  const modifiersWithExport: ts.Modifier[] = [
    ...(ref.modifiers ?? []),
    ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
  ]

  if (ts.isInterfaceDeclaration(ref)) {
    return ts.factory.updateInterfaceDeclaration(
      ref,
      modifiersWithExport,
      ref.name,
      ref.typeParameters,
      ref.heritageClauses,
      ref.members,
    )
  }

  if (ts.isEnumDeclaration(ref)) {
    return ts.factory.updateEnumDeclaration(
      ref,
      modifiersWithExport,
      ref.name,
      ref.members,
    )
  }

  if (ts.isTypeAliasDeclaration(ref)) {
    return ts.factory.updateTypeAliasDeclaration(
      ref,
      modifiersWithExport,
      ref.name,
      ref.typeParameters,
      ref.type,
    )
  }

  throw new PheroParseError("Type is not supported", ref)
}
