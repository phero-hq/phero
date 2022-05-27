import ts from "typescript"
import { ParsedAppDeclaration } from "./parseAppDeclaration"
import { Model } from "./parseSamenApp"

export interface ParsedAppDeclarationVersion {
  domainModels: Model[]
  errors: ts.ClassDeclaration[]
  services: Array<{
    name: string
    models: Model[]
    errors: ts.ClassDeclaration[]
    functions: ts.FunctionLikeDeclarationBase[]
    context: ts.TypeNode | undefined
  }>
}

export function getDeclarationForVersion(
  app: ParsedAppDeclaration,
  version = "v_1_0_0",
): ParsedAppDeclarationVersion {
  return {
    domainModels: app.domain[version]?.models ?? [],
    errors: app.domain[version]?.errors ?? [],
    services: app.services.map((service) => ({
      name: service.name,
      models: service.versions[version].models,
      errors: service.versions[version].errors,
      functions: service.versions[version].functions,
      context: service.versions[version].context,
    })),
  }
}
