import ts from "typescript"
import { generateInlineParser } from "./code-gen/generateRPCProxy"
import generateParserFromModel from "./code-gen/parsers/generateParserFromModel"
import generateParserModel from "./code-gen/parsers/generateParserModel"
import { ParsedPheroServiceConfig } from "./parsePheroApp/parsePheroApp"
import * as tsx from "./tsx"

export default function generateMiddlewareParsers(
  serviceName: string,
  serviceConfig: ParsedPheroServiceConfig,
  typeChecker: ts.TypeChecker,
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
              generateParserModel(typeChecker, middleware.paramsType, "data"),
            ),
          }),

          generateInlineParser({
            returnType: tsx.type.any,
            parser: generateParserFromModel(
              generateParserModel(typeChecker, middleware.contextType, "data"),
            ),
          }),

          middleware.nextType
            ? generateInlineParser({
                returnType: tsx.type.any,
                parser: generateParserFromModel(
                  generateParserModel(typeChecker, middleware.nextType, "data"),
                ),
              })
            : tsx.literal.null,
        ),
      ),
    ),
  })
}
