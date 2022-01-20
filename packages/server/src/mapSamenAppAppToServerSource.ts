import { ParsedSamenApp, ServerSource } from "@samen/core"

export function mapSamenAppAppToServerSource(
  app: ParsedSamenApp,
): ServerSource {
  return {
    domainModels: app.models,
    services: app.services.map((service) => ({
      name: service.name,
      models: service.models,
      functions: service.funcs.map((f) => f.actualFunction),
    })),
  }
}
