import ts from "typescript"
import { ParseError } from "./errors"
import {
  Model,
  ParsedSamenApp,
  ParsedSamenFunctionDefinition,
} from "./parseSamenApp"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const asyncModifier = ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

function generateNamespace(
  name: string,
  body: ts.Statement[],
): ts.ModuleDeclaration {
  return ts.factory.createModuleDeclaration(
    undefined,
    [exportModifier],
    ts.factory.createIdentifier(name),
    ts.factory.createModuleBlock(body),
    ts.NodeFlags.Namespace,
  )
}

export default function generateAppDeclarationFile(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
) {
  const t1 = Date.now()

  const versionIdentifier = ts.factory.createIdentifier("v_1_0_0")

  const sharedTypes = app.models.map((m) => typeChecker.getTypeAtLocation(m))

  // const x = app.models.map(m => m.)

  const serviceNamespaceDeclrs = [
    ...(app.models.length
      ? [
          generateNamespace(
            "domain",
            app.models.map((m) =>
              generateModelDeclaration(m, sharedTypes, typeChecker),
            ),
          ),
        ]
      : []),
    ...app.services.map((service) =>
      // export namespace cmsService {
      generateNamespace(service.name, [
        ...service.models.map((m) =>
          generateModelDeclaration(m, sharedTypes, typeChecker),
        ),
        ...service.funcs.map(
          (func) =>
            // // export namespace editArticle {
            // generateNamespace(func.name, [
            //   // export namespace v_latest {
            //   generateNamespace("v_latest", [
            // generate Function declaration
            generateFunction(func, sharedTypes, typeChecker),
          //   ]),
          // ]),
        ),
      ]),
    ),
  ]

  const xfiles: { [fileName: string]: string } = {}

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const file = ts.createSourceFile(
    "api.ts",
    "",
    ts.ScriptTarget.ES5,
    false,
    ts.ScriptKind.TS,
  )

  const result = printer.printList(
    ts.ListFormat.SourceFileStatements,
    ts.factory.createNodeArray(serviceNamespaceDeclrs),
    file,
  )

  xfiles["api.ts"] = result

  const opts: ts.CompilerOptions = {
    declaration: true,
    emitDeclarationOnly: true,
    // NOTE: we need Promise support in our declaration file. In a normal TS project you would add
    // the "es2015". Because we're implementing a file system here, sort of, we need to set the file
    // name more explicitly. (Implementing our own fileExists makes compilation much much faster.)
    lib: [
      // support for Promise
      "lib.es2015.d.ts",
      // support for Pick, Omit, and other TS utilities
      "lib.es5.d.ts",
    ],
  }
  const host = ts.createCompilerHost(opts)
  const originalReadFile = host.readFile

  host.writeFile = (fileName: string, contents: string) => {
    xfiles[fileName] = contents
  }
  host.readFile = (fileName: string) => {
    if (xfiles[fileName]) {
      return xfiles[fileName]
    }
    // Reads the lib files
    return originalReadFile(fileName)
  }
  host.fileExists = (fileName: string) => {
    return !!xfiles[fileName]
  }

  // // Prepare and emit the d.ts files
  const program = ts.createProgram(["api.ts"], opts, host)
  const emitResult = program.emit()

  const t2 = Date.now()
  console.log("parseSamenApp in", t2 - t1)

  console.log(ts.formatDiagnostics(emitResult.diagnostics, formatHost))
  console.log("errors", emitResult.diagnostics.length)

  console.log("==== api.ts ====")
  console.log(xfiles["api.ts"])
  console.log("==== api.d.ts ====")
  console.log(xfiles["api.d.ts"])
}

function generateFunction(
  func: ParsedSamenFunctionDefinition,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
): ts.FunctionDeclaration {
  return ts.factory.createFunctionDeclaration(
    undefined, // TODO decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // TODO asteriks is prohibited
    func.name,
    undefined, // TODO typeParameters are prohibited
    func.parameters.map((p) =>
      ts.factory.createParameterDeclaration(
        undefined,
        p.modifiers,
        p.dotDotDotToken,
        p.name,
        p.questionToken,
        p.type && generateTypeNode(p.type, sharedTypes, typeChecker),
        undefined, // initializer is prohibited, only on classes
      ),
    ),
    ts.factory.createTypeReferenceNode("Promise", [
      generateTypeNode(func.returnType, sharedTypes, typeChecker),
    ]),
    ts.factory.createBlock([
      ts.factory.createThrowStatement(
        ts.factory.createNewExpression(
          ts.factory.createIdentifier("Error"),
          undefined,
          [ts.factory.createStringLiteral("no impl", false)],
        ),
      ),
    ]),
  )
}

function generateModelDeclaration(
  model: Model,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
): Model {
  if (ts.isTypeAliasDeclaration(model)) {
    return ts.factory.createTypeAliasDeclaration(
      undefined,
      [exportModifier],
      cleanQualiedName(model.name),
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint &&
            generateTypeNode(tp.constraint, sharedTypes, typeChecker),
          tp.default && generateTypeNode(tp.default, sharedTypes, typeChecker),
        ),
      ),
      generateTypeNode(model.type, sharedTypes, typeChecker),
    )
  } else if (ts.isInterfaceDeclaration(model)) {
    return ts.factory.createInterfaceDeclaration(
      undefined,
      [exportModifier],
      cleanQualiedName(model.name),
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          cleanQualiedName(tp.name),
          tp.constraint &&
            generateTypeNode(tp.constraint, sharedTypes, typeChecker),
          tp.default && generateTypeNode(tp.default, sharedTypes, typeChecker),
        ),
      ),
      model.heritageClauses?.map((hc) =>
        ts.factory.createHeritageClause(
          hc.token,
          hc.types.map((t) =>
            ts.factory.createExpressionWithTypeArguments(
              t.expression,
              t.typeArguments?.map((t) =>
                generateTypeNode(t, sharedTypes, typeChecker),
              ),
            ),
          ),
        ),
      ),
      model.members.map((m) =>
        generateTypeElement(m, sharedTypes, typeChecker),
      ),
    )
  }

  return model
}

function generateTypeElement(
  typeElement: ts.TypeElement,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
): ts.TypeElement {
  if (ts.isPropertySignature(typeElement)) {
    return ts.factory.createPropertySignature(
      typeElement.modifiers,
      typeElement.name,
      typeElement.questionToken,
      typeElement.type &&
        generateTypeNode(typeElement.type, sharedTypes, typeChecker),
    )
  }

  if (ts.isIndexSignatureDeclaration(typeElement)) {
    return ts.factory.createIndexSignature(
      undefined,
      typeElement.modifiers,
      typeElement.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          undefined,
          p.modifiers,
          p.dotDotDotToken,
          p.name,
          p.questionToken,
          p.type && generateTypeNode(p.type, sharedTypes, typeChecker),
          p.initializer,
        ),
      ),
      generateTypeNode(typeElement.type, sharedTypes, typeChecker),
    )
  }

  throw new ParseError(
    "Only Property signature is allowed " + typeElement.kind,
    typeElement,
  )
}

function generateTypeNode(
  type: ts.TypeNode,
  sharedTypes: ts.Type[],
  typeChecker: ts.TypeChecker,
): ts.TypeNode {
  if (ts.isTypeReferenceNode(type)) {
    return ts.factory.createTypeReferenceNode(
      withNamespace(type, sharedTypes, typeChecker),
      type.typeArguments?.map((t) =>
        generateTypeNode(t, sharedTypes, typeChecker),
      ),
    )
  }
  if (ts.isLiteralTypeNode(type)) {
    if (ts.isStringLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createStringLiteral(type.literal.text),
      )
    } else if (ts.isNumericLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createNumericLiteral(type.literal.text),
      )
    }
  }
  if (ts.isUnionTypeNode(type)) {
    return ts.factory.createUnionTypeNode(
      type.types.map((t) => generateTypeNode(t, sharedTypes, typeChecker)),
    )
  }
  if (ts.isIntersectionTypeNode(type)) {
    return ts.factory.createIntersectionTypeNode(
      type.types.map((t) => generateTypeNode(t, sharedTypes, typeChecker)),
    )
  }

  if (ts.isTypeLiteralNode(type)) {
    return ts.factory.createTypeLiteralNode(
      type.members.map((m) => generateTypeElement(m, sharedTypes, typeChecker)),
    )
  }

  return type
}

function cleanQualiedName(entityName: ts.EntityName): ts.Identifier {
  if (ts.isQualifiedName(entityName)) {
    return entityName.right
  }
  return entityName
}

function withNamespace(
  typeNode: ts.TypeReferenceNode,
  sharedTypes: ts.Type[],
  // ns: ts.EntityName,
  typeChecker: ts.TypeChecker,
): ts.EntityName {
  const type = typeChecker.getTypeFromTypeNode(typeNode)

  const isSharedType = sharedTypes.some((st) => st.symbol === type.symbol)

  const clean = cleanQualiedName(typeNode.typeName)

  if (isSharedType) {
    return ts.factory.createQualifiedName(
      ts.factory.createIdentifier("domain"),
      clean,
    )
  }

  return clean
}
