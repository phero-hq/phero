import ts from "typescript"
import { PheroApp, PheroService } from "../domain/PheroApp"
import { printCode } from "../lib/tsTestUtils"
import * as tsx from "../tsx"
import generateErrorDeclaration from "./generateErrorDeclaration"
import generateFunctionDeclaration from "./generateFunctionDeclaration"
import generateModelDeclaration from "./generateModelDeclaration"

interface PheroManifest {
  content: string
}

export default function generateManifest(app: PheroApp): PheroManifest {
  return {
    content: printCode([
      generateDomainNamespace(app),
      ...generatePheroNamespace(app),
      ...app.services.map(generateServiceNamespace),
    ]),
  }
}

function generatePheroNamespace(app: PheroApp): ts.ModuleDeclaration[] {
  const isUsingPheroContext = app.services.some((s) => !!s.config.contextType)

  if (!isUsingPheroContext) {
    return []
  }

  return [
    tsx.namespace({
      export: true,
      declare: true,
      name: "phero",
      statements: [
        tsx.typeAlias({
          name: "PheroContext",
          typeParameters: [tsx.typeParam({ name: "T" })],
          type: tsx.type.reference({ name: "T" }),
        }),
      ],
    }),
  ]
}

function generateDomainNamespace(app: PheroApp): ts.ModuleDeclaration {
  return tsx.namespace({
    export: true,
    declare: true,
    name: "domain",
    statements: [
      tsx.namespace({
        name: "v_1_0_0",
        statements: [
          ...app.models.map(generateModelDeclaration),
          ...app.errors.map(generateErrorDeclaration),
        ],
      }),
    ],
  })
}

function generateServiceNamespace(service: PheroService): ts.ModuleDeclaration {
  return tsx.namespace({
    export: true,
    declare: true,
    name: service.name,
    statements: [
      tsx.namespace({
        name: "v_1_0_0",
        statements: service.funcs.map(generateFunctionDeclaration),
      }),
    ],
  })
}
