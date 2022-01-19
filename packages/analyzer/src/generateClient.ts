import ts from "typescript"
import {
  generateClientFunction,
  generateModel,
  generateNamespace,
  ReferenceMaker,
} from "./code-gen"
import { ParsedAppDeclaration } from "./parseAppDeclaration"
import { Model, ParsedSamenApp } from "./parseSamenApp"

export interface ServerSource {
  domainModels: Model[]
  services: Array<{
    name: string
    models: Model[]
    functions: ts.FunctionLikeDeclarationBase[]
  }>
}

export interface ClientSource {
  domainSource: ts.SourceFile
  samenClientSource: ts.SourceFile
}

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

export function mapParsedAppDeclarationToServerSource(
  app: ParsedAppDeclaration,
  version = "v_1_0_0",
): ServerSource {
  return {
    domainModels: app.domain[version].models,
    services: app.services.map((service) => ({
      name: service.name,
      models: service.versions[version].models,
      functions: service.versions[version].functions,
    })),
  }
}

export default function generateClient(
  serverSource: ServerSource,
  typeChecker: ts.TypeChecker,
): ClientSource {
  const t1 = Date.now()

  const { domainModels, services } = serverSource
  const domainRefMaker = new ReferenceMaker(
    domainModels,
    typeChecker,
    undefined,
    undefined,
  )

  const domainSource = ts.factory.createSourceFile(
    [
      ...domainModels.map((model) => generateModel(model, domainRefMaker)),
      ...services.map((service) =>
        generateNamespace(
          ts.factory.createIdentifier(service.name),
          service.models.map((model) => generateModel(model, domainRefMaker)),
        ),
      ),
    ],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  )

  const importDomain = ts.factory.createImportDeclaration(
    undefined,
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ...domainModels.map((model) =>
          ts.factory.createImportSpecifier(undefined, model.name),
        ),
        ...services.map((service) =>
          ts.factory.createImportSpecifier(
            undefined,
            ts.factory.createIdentifier(service.name),
          ),
        ),
      ]),
    ),
    ts.factory.createStringLiteral("./domain"),
  )
  const importBaseSamenClient = ts.factory.createImportDeclaration(
    undefined,
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          undefined,
          ts.factory.createIdentifier("BaseSamenClient"),
        ),
        ts.factory.createImportSpecifier(
          undefined,
          ts.factory.createIdentifier("Fetch"),
        ),
      ]),
    ),
    ts.factory.createStringLiteral("./BaseSamenClient"),
  )

  const hertitageClause: ts.HeritageClause = ts.factory.createHeritageClause(
    ts.SyntaxKind.ExtendsKeyword,
    [
      ts.factory.createExpressionWithTypeArguments(
        ts.factory.createIdentifier("BaseSamenClient"),
        undefined,
      ),
    ],
  )

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
            ts.factory.createStringLiteral("http://localhost:4321"),
          ),
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
        const { name, functions } = service

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
              generateClientFunction(func, serviceRefMaker),
            ),
            true,
          ),
        )
      }),
    ],
  )

  const samenClientSource = ts.factory.createSourceFile(
    [importDomain, importBaseSamenClient, classDeclr],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  )

  const t2 = Date.now()
  console.log("Generate client in ", t2 - t1)

  return {
    samenClientSource,
    domainSource,
  }
}
