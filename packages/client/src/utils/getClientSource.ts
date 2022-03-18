import ts from "typescript"
import {
  generateClientFunction,
  generateModel,
  generateNamespace,
  ReferenceMaker,
  ParsedAppDeclarationVersion,
} from "@samen/core"

export interface ClientSource {
  domainSource: ts.SourceFile
  samenClientSource: ts.SourceFile
}

export default function getClientSource(
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
          ts.factory.createImportSpecifier(false, undefined, model.name),
        ),
        ...services.map((service) =>
          ts.factory.createImportSpecifier(
            false,
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
          false,
          undefined,
          ts.factory.createIdentifier("BaseSamenClient"),
        ),
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier("Fetch"),
        ),
      ]),
    ),
    ts.factory.createStringLiteral("@samen/client"),
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
            ts.factory.createStringLiteral("http://localhost:4040"),
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
              generateClientFunction(name, func, serviceRefMaker),
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
  // console.log("Generate client in ", t2 - t1)

  return {
    samenClientSource,
    domainSource,
  }
}
