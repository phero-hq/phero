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
      tsx.classDeclaration({
        name: "PheroService",
        export: true,
        abstract: true,
        typeParams: [
          tsx.typeParam({
            name: "TContext",
            default: tsx.literal.type(),
          }),
        ],
      }),
      ...app.services.map(generatePheroService),
    ]),
  }
}

function generatePheroService(service: PheroService): ts.ClassDeclaration {
  return tsx.classDeclaration({
    name: service.name,
    export: true,
    elements: service.funcs.map(generateFunctionDeclaration),
    extendsType: ts.factory.createExpressionWithTypeArguments(
      tsx.expression.identifier("PheroService"),
      service.config.contextType ? [cloneTS(service.config.contextType)] : [],
    ),
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
