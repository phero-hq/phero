import ts from "typescript"
import {
  generateClientFunction,
  generateModel,
  generateNamespace,
  ReferenceMaker,
  ParsedAppDeclarationVersion,
  tsx,
  generateModelParser,
  generateNonModelParser,
} from "@samen/core"
import { ClientSource } from "../ClientSource"

export default function generateClientSource(
  appDeclarationVersion: ParsedAppDeclarationVersion,
  typeChecker: ts.TypeChecker,
): ClientSource {
  const t1 = Date.now()

  const { domainModels, services } = appDeclarationVersion
  const domainRefMaker = new ReferenceMaker(
    domainModels,
    typeChecker,
    undefined,
    undefined,
  )

  const importParserTypes = tsx.importDeclaration({
    isTypeOnly: true,
    names: ["ParseResult", "ValidationError"],
    module: "./ParseResult",
  })

  const domainSource = tsx.sourceFile(
    importParserTypes,
    ...domainModels.map((model) => generateModel(model, domainRefMaker)),
    ...domainModels.map((model) => generateModelParser(model, typeChecker)),
    ...services.map((service) =>
      generateNamespace(ts.factory.createIdentifier(service.name), [
        ...service.models.map((model) => generateModel(model, domainRefMaker)),
        ...service.models.map((model) =>
          generateModelParser(model, typeChecker),
        ),
      ]),
    ),
  )

  const importDomain = tsx.importDeclaration({
    names: [
      ...domainModels.map((model) => model.name.text),
      ...services.map((service) => service.name),
    ],
    module: "./domain",
  })

  const importBaseSamenClient = tsx.importDeclaration({
    names: ["BaseSamenClient", "Fetch"],
    module: "./BaseSamenClient",
  })

  const hertitageClause: ts.HeritageClause = ts.factory.createHeritageClause(
    ts.SyntaxKind.ExtendsKeyword,
    [
      ts.factory.createExpressionWithTypeArguments(
        ts.factory.createIdentifier("BaseSamenClient"),
        undefined,
      ),
    ],
  )

  const optsParam = generateOptsParam(appDeclarationVersion)

  const classDeclr: ts.ClassDeclaration = ts.factory.createClassDeclaration(
    undefined,
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier("SamenClient"),
    undefined,
    [hertitageClause],
    [
      ts.factory.createConstructorDeclaration(
        undefined,
        undefined,
        [
          ts.factory.createParameterDeclaration(
            undefined,
            [],
            undefined,
            "fetch",
            undefined,
            ts.factory.createTypeReferenceNode("Fetch"),
            undefined,
          ),
          ts.factory.createParameterDeclaration(
            undefined,
            [],
            undefined,
            "url",
            undefined,
            undefined,
            ts.factory.createStringLiteral("http://localhost:3030"),
          ),
          ...(optsParam ? [optsParam] : []),
        ],
        ts.factory.createBlock([
          ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
              ts.factory.createSuper(),
              undefined,
              [
                ts.factory.createIdentifier("fetch"),
                ts.factory.createIdentifier("url"),
              ],
            ),
          ),
        ]),
      ),
      ...services.map((service) => {
        const { name, functions, context } = service

        const serviceRefMaker = new ReferenceMaker(
          domainModels,
          typeChecker,
          undefined,
          ts.factory.createIdentifier(name),
        )

        return ts.factory.createPropertyDeclaration(
          undefined,
          [],
          name,
          undefined,
          undefined,
          ts.factory.createObjectLiteralExpression(
            functions.map((func) =>
              generateClientFunction(
                name,
                context,
                func,
                serviceRefMaker,
                typeChecker,
              ),
            ),
            true,
          ),
        )
      }),
    ],
  )

  const parserDeclrs: ts.FunctionDeclaration[] = generateParsersForReturnTypes(
    appDeclarationVersion,
    typeChecker,
  )

  const samenClientSource = tsx.sourceFile(
    importDomain,
    importBaseSamenClient,
    importParserTypes,
    ...parserDeclrs,
    classDeclr,
  )

  const t2 = Date.now()
  // console.log("Generate client in ", t2 - t1)

  return {
    samenClientSource,
    domainSource,
  }
}

function generateOptsParam(
  appDeclarationVersion: ParsedAppDeclarationVersion,
): ts.ParameterDeclaration | undefined {
  const optsProps = [generateContextParam(appDeclarationVersion)].filter(
    (prop): prop is ts.PropertySignature => !!prop,
  )

  if (optsProps.length === 0) {
    return undefined
  }

  return tsx.param({
    private: true,
    readonly: true,
    name: "opts",
    type: tsx.literal.type(...optsProps),
  })
}

function generateContextParam(
  appDeclarationVersion: ParsedAppDeclarationVersion,
): ts.PropertySignature | undefined {
  const serviceContextTypes = appDeclarationVersion.services
    .filter((service) => !!service.context)
    .map((service) => ({
      serviceName: service.name,
      contextType: service.context,
    })) as { serviceName: string; contextType: ts.TypeNode }[]

  if (!serviceContextTypes.length) {
    return undefined
  }

  return tsx.property.signature(
    "context",
    tsx.literal.type(
      ...serviceContextTypes.map(({ serviceName, contextType }) =>
        tsx.property.signature(
          serviceName,
          tsx.literal.function({
            params: [],
            type: tsx.type.union(
              contextType,
              tsx.type.reference({ name: "Promise", args: [contextType] }),
            ),
          }),
        ),
      ),
    ),
  )
}

function generateParsersForReturnTypes(
  appDeclarationVersion: ParsedAppDeclarationVersion,
  typeChecker: ts.TypeChecker,
): ts.FunctionDeclaration[] {
  const result: ts.FunctionDeclaration[] = []

  for (const service of appDeclarationVersion.services) {
    for (const func of service.functions) {
      const returnType: ts.TypeNode | undefined =
        func.type && ts.isTypeReferenceNode(func.type)
          ? func.type.typeArguments?.[0]
          : undefined

      if (!returnType || ts.isTypeReferenceNode(returnType)) {
        continue
      }

      result.push(
        generateNonModelParser(
          returnType,
          returnType,
          typeChecker,
          `${func.name?.getText()}ResultParser`,
        ),
      )
    }
  }
  return result
}
