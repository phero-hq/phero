import ts from "typescript"
import { generateInlineParser } from "./code-gen/generateRPCProxy"
import generateParserFromModel from "./code-gen/parsers/generateParserFromModel"
import generateParserModel from "./code-gen/parsers/generateParserModel"
import { PheroServiceConfig } from "./parsePheroApp/domain"
import * as tsx from "./tsx"

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
          generateInlineParser({
            returnType: tsx.type.any,
            parser: generateParserFromModel(
              generateParserModel(middleware.paramsType, "data", prog),
            ),
          }),

          generateInlineParser({
            returnType: tsx.type.any,
            parser: generateParserFromModel(
              generateParserModel(middleware.contextType, "data", prog),
            ),
          }),

          middleware.nextType
            ? generateInlineParser({
                returnType: tsx.type.any,
                parser: generateParserFromModel(
                  generateParserModel(middleware.nextType, "data", prog),
                ),
              })
            : tsx.literal.null,
        ),
      ),
    ),
  })
}
