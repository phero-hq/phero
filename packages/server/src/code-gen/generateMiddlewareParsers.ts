import ts from "typescript"

import { generateInlineParser, PheroServiceConfig, tsx } from "@phero/core"

export default function generateMiddlewareParsers(
  serviceName: string,
  serviceConfig: PheroServiceConfig,
  prog: ts.Program,
): ts.VariableStatement {
  const middlewares = serviceConfig.middleware ?? []
  return tsx.const({
    name: `service_middlewares_${serviceName}`,
    init: tsx.literal.array(
      ...middlewares.map((middleware) =>
        tsx.literal.array(
          generateInlineParser(tsx.type.any, middleware.paramsType, prog),

          generateInlineParser(tsx.type.any, middleware.contextType, prog),

          middleware.nextType
            ? generateInlineParser(tsx.type.any, middleware.nextType, prog)
            : tsx.literal.null,
        ),
      ),
    ),
  })
}
