import {
  generateTypeNode,
  PheroApp,
  PheroError,
  PheroFunction,
  PheroService,
  tsx,
  generateDependencyRefs,
  generateParserFunction,
} from "@phero/core"
import ts from "typescript"

export default function generateClientSource2(
  app: PheroApp,
  prog: ts.Program,
): ts.SourceFile {
  const importsFromClientPackage = tsx.importDeclaration({
    names: ["Fetch", "BasePheroClient", "ParseResult", "ValidationError"],
    module: "@phero/client",
  })

  const hertitageClause: ts.HeritageClause = ts.factory.createHeritageClause(
    ts.SyntaxKind.ExtendsKeyword,
    [
      ts.factory.createExpressionWithTypeArguments(
        ts.factory.createIdentifier("BasePheroClient"),
        undefined,
      ),
    ],
  )

  const optsParam = generateOptsParam(app)

  const classDeclr: ts.ClassDeclaration = ts.factory.createClassDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    "PheroClient",
    undefined,
    [hertitageClause],
    [
      ts.factory.createConstructorDeclaration(
        undefined,
        [
          ts.factory.createParameterDeclaration(
            [],
            undefined,
            "fetch",
            undefined,
            ts.factory.createTypeReferenceNode("Fetch"),
            undefined,
          ),
          ts.factory.createParameterDeclaration(
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
      ...app.services.map((service) => {
        const {
          name,
          funcs,
          config: { contextType },
        } = service

        return ts.factory.createPropertyDeclaration(
          [],
          name,
          undefined,
          undefined,
          ts.factory.createObjectLiteralExpression(
            funcs.map((func) => generateClientFunction(service, func, prog)),
            true,
          ),
        )
      }),
    ],
  )

  const depRef = generateDependencyRefs(app.deps)

  const pheroClientSource = tsx.sourceFile(
    importsFromClientPackage,
    ...app.models.map((model) => model.ref),
    ...Object.entries(app.deps).map(([name, model]) =>
      generateParserFunction(name, model, depRef),
    ),
    ...app.errors.map((err) => generateError(err)),
    ...app.services.flatMap((service) =>
      service.funcs.map((func) =>
        generateParserFunction(
          `${service.name}__${func.name}__parser`,
          func.returnTypeModel,
          depRef,
        ),
      ),
    ),
    ...app.services.map((service) =>
      generateErrorParser(service.name, app.errors),
    ),
    classDeclr,
  )

  return pheroClientSource
}

function generateOptsParam(app: PheroApp): ts.ParameterDeclaration | undefined {
  const optsProps = [generateContextParam(app)].filter(
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

function generateContextParam(app: PheroApp): ts.PropertySignature | undefined {
  const serviceContextTypes = app.services.reduce<
    { serviceName: string; contextType: ts.TypeNode }[]
  >((result, service) => {
    const serviceContextType = service.funcs
      .map((f) => f.contextParameterType)
      .find((c) => !!c)

    if (!serviceContextType) {
      return result
    }

    return [
      ...result,
      {
        serviceName: service.name,
        contextType: serviceContextType,
      },
    ]
  }, [])

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

function generateError(parsedError: PheroError): ts.ClassDeclaration {
  return tsx.classDeclaration({
    name: parsedError.name,
    extendsType: ts.factory.createExpressionWithTypeArguments(
      tsx.expression.identifier("Error"),
      undefined,
    ),
    export: true,
    constructor: tsx.constructor({
      params: parsedError.properties.map((prop) =>
        tsx.param({
          public: true,
          readonly: true,
          name: prop.name,
          type: generateTypeNode(prop.type),
        }),
      ),
      block: tsx.block(
        tsx.statement.expression(
          tsx.expression.call(tsx.expression.identifier("super"), {
            args: ["message"],
          }),
        ),
      ),
    }),
  })
}

function generateErrorParser(
  serviceName: string,
  parsedErrors: PheroError[],
): ts.FunctionDeclaration {
  const fallbackSt = tsx.statement.if({
    expression: tsx.expression.binary(
      tsx.expression.propertyAccess("error", "name"),
      "===",
      tsx.literal.string("Error"),
    ),
    then: returnError("Error", [
      tsx.expression.propertyAccess("error", "props", "message"),
    ]),
    else: returnError("Error", [tsx.literal.string("Unknown Error")]),
  })

  return tsx.function({
    name: `error_parser_${serviceName}`,
    params: [tsx.param({ name: "error", type: tsx.type.any })],
    returnType: tsx.type.union(
      tsx.type.reference({ name: "Error" }),
      ...parsedErrors.map((e) => tsx.type.reference({ name: e.name })),
    ),
    body: tsx.block(
      parsedErrors.reduceRight(
        (elseSt, parsedError) =>
          tsx.statement.if({
            expression: tsx.expression.binary(
              tsx.expression.propertyAccess("error", "name"),
              "===",
              tsx.literal.string(parsedError.name),
            ),
            then: returnError(
              parsedError.name,
              parsedError.properties.map((prop) =>
                tsx.expression.propertyAccess("error", "props", prop.name),
              ),
            ),
            else: elseSt,
          }),
        fallbackSt,
      ),
    ),
  })
}

function returnError(name: string, args: ts.Expression[]): ts.ReturnStatement {
  return tsx.statement.return(
    tsx.expression.new(tsx.expression.identifier(name), { args }),
  )
}

function generateClientFunction(
  service: PheroService,
  func: PheroFunction,
  prog: ts.Program,
): ts.PropertyAssignment {
  let parameters = func.parameters.map((p) =>
    ts.factory.createParameterDeclaration(
      undefined,
      undefined,
      p.name,
      p.questionToken
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      generateTypeNode(p.type),
      undefined, // initializer is prohibited, only on classes
    ),
  )

  return ts.factory.createPropertyAssignment(
    func.name,
    ts.factory.createArrowFunction(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      parameters,
      tsx.type.reference({
        name: "Promise",
        args: [generateTypeNode(func.returnType)],
      }),
      undefined,
      generateClientFunctionBlock(service, func),
    ),
  )
}

function generateClientFunctionBlock(
  service: PheroService,
  func: PheroFunction,
): ts.Block {
  const isVoid = func.returnType.kind === ts.SyntaxKind.VoidKeyword

  return tsx.block(
    tsx.statement.return(
      tsx.expression.call(
        tsx.expression.propertyAccess(
          ts.factory.createThis(),
          isVoid ? "requestVoid" : "request",
        ),
        {
          typeArgs: isVoid ? undefined : [generateTypeNode(func.returnType)],

          args: [
            tsx.literal.string(service.name),
            tsx.literal.string(func.name),
            tsx.literal.object(
              ...[
                ...(func.contextParameterType
                  ? [
                      tsx.property.assignment(
                        "context",
                        tsx.expression.await(
                          tsx.expression.call(
                            tsx.expression.propertyAccess(
                              ts.factory.createThis(),
                              "opts",
                              "context",
                              service.name,
                            ),
                          ),
                        ),
                      ),
                    ]
                  : []),
                ...func.parameters.map((p) =>
                  tsx.property.shorthandAssignment(p.name),
                ),
              ],
            ),
            `error_parser_${service.name}`,
            ...(isVoid
              ? []
              : [
                  tsx.expression.identifier(
                    `${service.name}__${func.name}__parser`,
                  ),
                ]),
          ],
        },
      ),
    ),
  )
}
