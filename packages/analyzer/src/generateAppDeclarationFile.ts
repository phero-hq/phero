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

  const serviceNamespaceDeclrs = [
    generateNamespace(
      // export namespace domain {
      "domain",
      app.models.map(generateModelDeclaration),
    ),
    ...app.services.map((service) =>
      // export namespace cmsService {
      generateNamespace(service.name, [
        ...service.models.map(generateModelDeclaration),
        ...service.funcs.map((func) =>
          // export namespace editArticle {
          generateNamespace(func.name, [
            // export namespace v1 {
            generateNamespace("v1", [
              // generate Function declaration
              generateFunction(func),
            ]),
          ]),
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

  const result = printer.printNode(
    ts.EmitHint.Unspecified,
    ts.factory.createModuleBlock(serviceNamespaceDeclrs),
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
): ts.FunctionDeclaration {
  return ts.factory.createFunctionDeclaration(
    undefined, // TODO decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // TODO asteriks is prohibited
    func.name,
    undefined, // TODO typeParameters are prohibited
    // func.parameters,
    func.parameters.map((p) =>
      ts.factory.createParameterDeclaration(
        undefined,
        p.modifiers,
        p.dotDotDotToken,
        p.name,
        p.questionToken,
        p.type && generateTypeNode(p.type),
        undefined, // initializer is prohibited, only on classes
      ),
    ),
    generateTypeNode(func.returnType),
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

function generateModelDeclaration(model: Model): Model {
  if (ts.isTypeAliasDeclaration(model)) {
    return ts.factory.createTypeAliasDeclaration(
      undefined,
      [exportModifier],
      cleanQualiedName(model.name),
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint),
          tp.default && generateTypeNode(tp.default),
        ),
      ),
      generateTypeNode(model.type),
    )
  } else if (ts.isInterfaceDeclaration(model)) {
    return ts.factory.createInterfaceDeclaration(
      undefined,
      [exportModifier],
      cleanQualiedName(model.name),
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          cleanQualiedName(tp.name),
          tp.constraint && generateTypeNode(tp.constraint),
          tp.default && generateTypeNode(tp.default),
        ),
      ),
      model.heritageClauses?.map((hc) =>
        ts.factory.createHeritageClause(
          hc.token,
          hc.types.map((t) =>
            ts.factory.createExpressionWithTypeArguments(
              t.expression,
              t.typeArguments?.map(generateTypeNode),
            ),
          ),
        ),
      ),
      model.members.map(generateTypeElement),
    )
  }

  return model
}

function generateTypeElement(typeElement: ts.TypeElement): ts.TypeElement {
  if (ts.isPropertySignature(typeElement)) {
    return ts.factory.createPropertySignature(
      typeElement.modifiers,
      typeElement.name,
      typeElement.questionToken,
      typeElement.type && generateTypeNode(typeElement.type),
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
          p.type && generateTypeNode(p.type),
          p.initializer,
        ),
      ),
      generateTypeNode(typeElement.type),
    )
  }

  throw new ParseError(
    "Only Property signature is allowed " + typeElement.kind,
    typeElement,
  )
}

function generateTypeNode(type: ts.TypeNode): ts.TypeNode {
  if (ts.isTypeReferenceNode(type)) {
    return ts.factory.createTypeReferenceNode(
      type.typeName,
      type.typeArguments?.map(generateTypeNode),
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
    return ts.factory.createUnionTypeNode(type.types.map(generateTypeNode))
  }
  if (ts.isIntersectionTypeNode(type)) {
    return ts.factory.createIntersectionTypeNode(
      type.types.map(generateTypeNode),
    )
  }

  if (ts.isTypeLiteralNode(type)) {
    return ts.factory.createTypeLiteralNode(
      type.members.map(generateTypeElement),
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
