import { promises as fs } from "fs"
import path from "path"
import ts from "typescript"
import {
  generateClientFunction,
  generateFunction,
  generateModel,
  generateNamespace,
  makeReference,
} from "./code-gen"
import { ParsedAppDeclaration } from "./parseAppDeclaration"

export default async function generateClient(
  app: ParsedAppDeclaration,
  typeChecker: ts.TypeChecker,
): Promise<void> {
  const t1 = Date.now()
  const outputPath = "/Users/kamilafsar/Projects/samen/packages/analyzer/out"
  const version = "v_1_0_0"

  await fs.mkdir(outputPath, { recursive: true })

  const domainModels = app.domain[version].models
  const makeDomainRef = makeReference(
    domainModels,
    typeChecker,
    undefined,
    undefined,
  )

  const domainSourceFile = ts.factory.createSourceFile(
    [
      ...domainModels.map((model) => generateModel(model, makeDomainRef)),
      ...app.services.map((service) =>
        generateNamespace(
          ts.factory.createIdentifier(service.name),
          service.versions[version].models.map((model) =>
            generateModel(model, makeDomainRef),
          ),
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
        ...app.services.map((service) =>
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
      ...app.services.map((service) => {
        const { functions } = service.versions[version]

        const makeServiceRef = makeReference(
          domainModels,
          typeChecker,
          undefined,
          ts.factory.createIdentifier(service.name),
        )

        return ts.factory.createPropertyDeclaration(
          undefined,
          [],
          service.name,
          undefined,
          undefined,
          ts.factory.createObjectLiteralExpression(
            functions.map((func) =>
              generateClientFunction(func, makeServiceRef),
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

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
    removeComments: true,
    omitTrailingSemicolon: false,
  })

  await fs.writeFile(
    path.join(outputPath, "domain.ts"),
    printer.printFile(domainSourceFile),
    { encoding: "utf-8" },
  )

  await fs.copyFile(
    path.join(__dirname, "../src/BaseSamenClient.ts"),
    path.join(outputPath, "BaseSamenClient.ts"),
  )

  await fs.writeFile(
    path.join(outputPath, `SamenClient.ts`),
    printer.printFile(samenClientSource),
    { encoding: "utf-8" },
  )

  const t2 = Date.now()
  console.log("Generate client in ", t2 - t1)
}
