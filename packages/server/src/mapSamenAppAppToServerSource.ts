import { ParsedSamenApp, ParsedAppDeclarationVersion } from "@samen/core"

export function mapSamenAppAppToServerSource(
  app: ParsedSamenApp,
): ParsedAppDeclarationVersion {
  return {
    domainModels: app.models,
    services: app.services.map((service) => ({
      name: service.name,
      models: service.models,
      functions: service.funcs.map((f) => f.actualFunction),
    })),
  }
}
