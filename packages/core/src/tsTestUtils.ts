import ts, {
  FunctionLikeDeclarationBase,
  VariableDeclaration,
} from "typescript"
import { TSFiles, VirtualCompilerHost } from "./VirtualCompilerHost"
import { ParsedSamenApp } from "./parseSamenApp"
import { KindToNodeMappings } from "./tsUtils"

export function printSamenApp(app: ParsedSamenApp): string {
  return JSON.stringify(
    {
      services: app.services.map((service) => ({
        name: service.name,
        funcs: service.funcs.map((func) => ({
          name: func.name,
          config: {
            ...func.config,
            // middleware: func.config.middleware?.map(printFunctionDeclaration),
          },
          func: printFunctionDeclaration(func.actualFunction),
        })),
      })),
    },
    null,
    4,
  )

  function printFunctionDeclaration(
    func: FunctionLikeDeclarationBase | VariableDeclaration,
  ): string {
    return func.kind === ts.SyntaxKind.FunctionDeclaration
      ? `[FunctionDeclaration(${func.name?.getText()})]`
      : func.kind === ts.SyntaxKind.VariableDeclaration
      ? `[VariableDeclaration(${func.name?.getText()})]`
      : func.kind === ts.SyntaxKind.FunctionExpression
      ? `[FunctionExpression(${func.name?.getText()})]`
      : func.kind === ts.SyntaxKind.ArrowFunction
      ? `[ArrowFunction(${func.name?.getText()})]`
      : "[UNKNOWN]"
  }
}

export function createTestProgram(input: TSFiles | string): ts.Program {
  const vHost = new VirtualCompilerHost()

  if (typeof input === "string") {
    vHost.addFile(`samen.ts`, input)
  } else {
    for (const [fileName, content] of Object.entries(input)) {
      vHost.addFile(`${fileName}.ts`, content)
    }
  }

  const program = vHost.createProgram("samen.ts")
  return program
}

export function compileStatement<SK extends ts.SyntaxKind>(
  code: string,
  syntaxKind: SK,
): { statement: KindToNodeMappings[SK]; typeChecker: ts.TypeChecker } {
  const prog = createTestProgram(code)
  const statements = prog.getSourceFile("samen.ts")?.statements
  if (statements?.length !== 1) {
    throw new Error("Should provide exactly 1 statement")
  }
  const statement = statements[0]
  if (statement.kind !== syntaxKind) {
    throw new Error(
      `SytaxKind of statement is ${statement.kind}, but ${syntaxKind} was expected`,
    )
  }

  return {
    typeChecker: prog.getTypeChecker(),
    statement: statement as KindToNodeMappings[SK],
  }
}

export function compileStatements(code: string): {
  statements: ts.Statement[]
  typeChecker: ts.TypeChecker
} {
  const prog = createTestProgram(code)
  const statements = prog.getSourceFile("samen.ts")?.statements
  if (!statements || statements.length < 1) {
    throw new Error("Should provide at least 1 statement")
  }

  return {
    typeChecker: prog.getTypeChecker(),
    statements: statements.map((s) => s),
  }
}

export function compileProgram(input: TSFiles): {
  statements: ts.Statement[]
  typeChecker: ts.TypeChecker
} {
  const prog = createTestProgram(input)
  const statements = prog.getSourceFile("samen.ts")?.statements
  if (!statements || statements.length < 1) {
    throw new Error("Should provide at least 1 statement")
  }

  return {
    typeChecker: prog.getTypeChecker(),
    statements: statements.map((s) => s),
  }
}

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true,
  removeComments: true,
  omitTrailingSemicolon: false,
})

export function printCode(node: ts.Node): string {
  const sf = ts.createSourceFile(
    "a.ts",
    "",
    ts.ScriptTarget.ESNext,
    undefined,
    ts.ScriptKind.TS,
  )

  return printer.printNode(ts.EmitHint.Unspecified, node, sf)
}

export function printKind(kind: ts.SyntaxKind): string {
  switch (kind) {
    case ts.SyntaxKind.Unknown:
      return "Unknown"
    case ts.SyntaxKind.EndOfFileToken:
      return "EndOfFileToken"
    case ts.SyntaxKind.SingleLineCommentTrivia:
      return "SingleLineCommentTrivia"
    case ts.SyntaxKind.MultiLineCommentTrivia:
      return "MultiLineCommentTrivia"
    case ts.SyntaxKind.NewLineTrivia:
      return "NewLineTrivia"
    case ts.SyntaxKind.WhitespaceTrivia:
      return "WhitespaceTrivia"
    case ts.SyntaxKind.ShebangTrivia:
      return "ShebangTrivia"
    case ts.SyntaxKind.ConflictMarkerTrivia:
      return "ConflictMarkerTrivia"
    case ts.SyntaxKind.NumericLiteral:
      return "NumericLiteral"
    case ts.SyntaxKind.BigIntLiteral:
      return "BigIntLiteral"
    case ts.SyntaxKind.StringLiteral:
      return "StringLiteral"
    case ts.SyntaxKind.JsxText:
      return "JsxText"
    case ts.SyntaxKind.JsxTextAllWhiteSpaces:
      return "JsxTextAllWhiteSpaces"
    case ts.SyntaxKind.RegularExpressionLiteral:
      return "RegularExpressionLiteral"
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return "NoSubstitutionTemplateLiteral"
    case ts.SyntaxKind.TemplateHead:
      return "TemplateHead"
    case ts.SyntaxKind.TemplateMiddle:
      return "TemplateMiddle"
    case ts.SyntaxKind.TemplateTail:
      return "TemplateTail"
    case ts.SyntaxKind.OpenBraceToken:
      return "OpenBraceToken"
    case ts.SyntaxKind.CloseBraceToken:
      return "CloseBraceToken"
    case ts.SyntaxKind.OpenParenToken:
      return "OpenParenToken"
    case ts.SyntaxKind.CloseParenToken:
      return "CloseParenToken"
    case ts.SyntaxKind.OpenBracketToken:
      return "OpenBracketToken"
    case ts.SyntaxKind.CloseBracketToken:
      return "CloseBracketToken"
    case ts.SyntaxKind.DotToken:
      return "DotToken"
    case ts.SyntaxKind.DotDotDotToken:
      return "DotDotDotToken"
    case ts.SyntaxKind.SemicolonToken:
      return "SemicolonToken"
    case ts.SyntaxKind.CommaToken:
      return "CommaToken"
    case ts.SyntaxKind.QuestionDotToken:
      return "QuestionDotToken"
    case ts.SyntaxKind.LessThanToken:
      return "LessThanToken"
    case ts.SyntaxKind.LessThanSlashToken:
      return "LessThanSlashToken"
    case ts.SyntaxKind.GreaterThanToken:
      return "GreaterThanToken"
    case ts.SyntaxKind.LessThanEqualsToken:
      return "LessThanEqualsToken"
    case ts.SyntaxKind.GreaterThanEqualsToken:
      return "GreaterThanEqualsToken"
    case ts.SyntaxKind.EqualsEqualsToken:
      return "EqualsEqualsToken"
    case ts.SyntaxKind.ExclamationEqualsToken:
      return "ExclamationEqualsToken"
    case ts.SyntaxKind.EqualsEqualsEqualsToken:
      return "EqualsEqualsEqualsToken"
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      return "ExclamationEqualsEqualsToken"
    case ts.SyntaxKind.EqualsGreaterThanToken:
      return "EqualsGreaterThanToken"
    case ts.SyntaxKind.PlusToken:
      return "PlusToken"
    case ts.SyntaxKind.MinusToken:
      return "MinusToken"
    case ts.SyntaxKind.AsteriskToken:
      return "AsteriskToken"
    case ts.SyntaxKind.AsteriskAsteriskToken:
      return "AsteriskAsteriskToken"
    case ts.SyntaxKind.SlashToken:
      return "SlashToken"
    case ts.SyntaxKind.PercentToken:
      return "PercentToken"
    case ts.SyntaxKind.PlusPlusToken:
      return "PlusPlusToken"
    case ts.SyntaxKind.MinusMinusToken:
      return "MinusMinusToken"
    case ts.SyntaxKind.LessThanLessThanToken:
      return "LessThanLessThanToken"
    case ts.SyntaxKind.GreaterThanGreaterThanToken:
      return "GreaterThanGreaterThanToken"
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
      return "GreaterThanGreaterThanGreaterThanToken"
    case ts.SyntaxKind.AmpersandToken:
      return "AmpersandToken"
    case ts.SyntaxKind.BarToken:
      return "BarToken"
    case ts.SyntaxKind.CaretToken:
      return "CaretToken"
    case ts.SyntaxKind.ExclamationToken:
      return "ExclamationToken"
    case ts.SyntaxKind.TildeToken:
      return "TildeToken"
    case ts.SyntaxKind.AmpersandAmpersandToken:
      return "AmpersandAmpersandToken"
    case ts.SyntaxKind.BarBarToken:
      return "BarBarToken"
    case ts.SyntaxKind.QuestionToken:
      return "QuestionToken"
    case ts.SyntaxKind.ColonToken:
      return "ColonToken"
    case ts.SyntaxKind.AtToken:
      return "AtToken"
    case ts.SyntaxKind.QuestionQuestionToken:
      return "QuestionQuestionToken"
    case ts.SyntaxKind.BacktickToken:
      return "BacktickToken"
    case ts.SyntaxKind.HashToken:
      return "HashToken"
    case ts.SyntaxKind.EqualsToken:
      return "EqualsToken"
    case ts.SyntaxKind.PlusEqualsToken:
      return "PlusEqualsToken"
    case ts.SyntaxKind.MinusEqualsToken:
      return "MinusEqualsToken"
    case ts.SyntaxKind.AsteriskEqualsToken:
      return "AsteriskEqualsToken"
    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
      return "AsteriskAsteriskEqualsToken"
    case ts.SyntaxKind.SlashEqualsToken:
      return "SlashEqualsToken"
    case ts.SyntaxKind.PercentEqualsToken:
      return "PercentEqualsToken"
    case ts.SyntaxKind.LessThanLessThanEqualsToken:
      return "LessThanLessThanEqualsToken"
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
      return "GreaterThanGreaterThanEqualsToken"
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      return "GreaterThanGreaterThanGreaterThanEqualsToken"
    case ts.SyntaxKind.AmpersandEqualsToken:
      return "AmpersandEqualsToken"
    case ts.SyntaxKind.BarEqualsToken:
      return "BarEqualsToken"
    case ts.SyntaxKind.BarBarEqualsToken:
      return "BarBarEqualsToken"
    case ts.SyntaxKind.AmpersandAmpersandEqualsToken:
      return "AmpersandAmpersandEqualsToken"
    case ts.SyntaxKind.QuestionQuestionEqualsToken:
      return "QuestionQuestionEqualsToken"
    case ts.SyntaxKind.CaretEqualsToken:
      return "CaretEqualsToken"
    case ts.SyntaxKind.Identifier:
      return "Identifier"
    case ts.SyntaxKind.PrivateIdentifier:
      return "PrivateIdentifier"
    case ts.SyntaxKind.BreakKeyword:
      return "BreakKeyword"
    case ts.SyntaxKind.CaseKeyword:
      return "CaseKeyword"
    case ts.SyntaxKind.CatchKeyword:
      return "CatchKeyword"
    case ts.SyntaxKind.ClassKeyword:
      return "ClassKeyword"
    case ts.SyntaxKind.ConstKeyword:
      return "ConstKeyword"
    case ts.SyntaxKind.ContinueKeyword:
      return "ContinueKeyword"
    case ts.SyntaxKind.DebuggerKeyword:
      return "DebuggerKeyword"
    case ts.SyntaxKind.DefaultKeyword:
      return "DefaultKeyword"
    case ts.SyntaxKind.DeleteKeyword:
      return "DeleteKeyword"
    case ts.SyntaxKind.DoKeyword:
      return "DoKeyword"
    case ts.SyntaxKind.ElseKeyword:
      return "ElseKeyword"
    case ts.SyntaxKind.EnumKeyword:
      return "EnumKeyword"
    case ts.SyntaxKind.ExportKeyword:
      return "ExportKeyword"
    case ts.SyntaxKind.ExtendsKeyword:
      return "ExtendsKeyword"
    case ts.SyntaxKind.FalseKeyword:
      return "FalseKeyword"
    case ts.SyntaxKind.FinallyKeyword:
      return "FinallyKeyword"
    case ts.SyntaxKind.ForKeyword:
      return "ForKeyword"
    case ts.SyntaxKind.FunctionKeyword:
      return "FunctionKeyword"
    case ts.SyntaxKind.IfKeyword:
      return "IfKeyword"
    case ts.SyntaxKind.ImportKeyword:
      return "ImportKeyword"
    case ts.SyntaxKind.InKeyword:
      return "InKeyword"
    case ts.SyntaxKind.InstanceOfKeyword:
      return "InstanceOfKeyword"
    case ts.SyntaxKind.NewKeyword:
      return "NewKeyword"
    case ts.SyntaxKind.NullKeyword:
      return "NullKeyword"
    case ts.SyntaxKind.ReturnKeyword:
      return "ReturnKeyword"
    case ts.SyntaxKind.SuperKeyword:
      return "SuperKeyword"
    case ts.SyntaxKind.SwitchKeyword:
      return "SwitchKeyword"
    case ts.SyntaxKind.ThisKeyword:
      return "ThisKeyword"
    case ts.SyntaxKind.ThrowKeyword:
      return "ThrowKeyword"
    case ts.SyntaxKind.TrueKeyword:
      return "TrueKeyword"
    case ts.SyntaxKind.TryKeyword:
      return "TryKeyword"
    case ts.SyntaxKind.TypeOfKeyword:
      return "TypeOfKeyword"
    case ts.SyntaxKind.VarKeyword:
      return "VarKeyword"
    case ts.SyntaxKind.VoidKeyword:
      return "VoidKeyword"
    case ts.SyntaxKind.WhileKeyword:
      return "WhileKeyword"
    case ts.SyntaxKind.WithKeyword:
      return "WithKeyword"
    case ts.SyntaxKind.ImplementsKeyword:
      return "ImplementsKeyword"
    case ts.SyntaxKind.InterfaceKeyword:
      return "InterfaceKeyword"
    case ts.SyntaxKind.LetKeyword:
      return "LetKeyword"
    case ts.SyntaxKind.PackageKeyword:
      return "PackageKeyword"
    case ts.SyntaxKind.PrivateKeyword:
      return "PrivateKeyword"
    case ts.SyntaxKind.ProtectedKeyword:
      return "ProtectedKeyword"
    case ts.SyntaxKind.PublicKeyword:
      return "PublicKeyword"
    case ts.SyntaxKind.StaticKeyword:
      return "StaticKeyword"
    case ts.SyntaxKind.YieldKeyword:
      return "YieldKeyword"
    case ts.SyntaxKind.AbstractKeyword:
      return "AbstractKeyword"
    case ts.SyntaxKind.AsKeyword:
      return "AsKeyword"
    case ts.SyntaxKind.AssertsKeyword:
      return "AssertsKeyword"
    case ts.SyntaxKind.AssertKeyword:
      return "AssertKeyword"
    case ts.SyntaxKind.AnyKeyword:
      return "AnyKeyword"
    case ts.SyntaxKind.AsyncKeyword:
      return "AsyncKeyword"
    case ts.SyntaxKind.AwaitKeyword:
      return "AwaitKeyword"
    case ts.SyntaxKind.BooleanKeyword:
      return "BooleanKeyword"
    case ts.SyntaxKind.ConstructorKeyword:
      return "ConstructorKeyword"
    case ts.SyntaxKind.DeclareKeyword:
      return "DeclareKeyword"
    case ts.SyntaxKind.GetKeyword:
      return "GetKeyword"
    case ts.SyntaxKind.InferKeyword:
      return "InferKeyword"
    case ts.SyntaxKind.IntrinsicKeyword:
      return "IntrinsicKeyword"
    case ts.SyntaxKind.IsKeyword:
      return "IsKeyword"
    case ts.SyntaxKind.KeyOfKeyword:
      return "KeyOfKeyword"
    case ts.SyntaxKind.ModuleKeyword:
      return "ModuleKeyword"
    case ts.SyntaxKind.NamespaceKeyword:
      return "NamespaceKeyword"
    case ts.SyntaxKind.NeverKeyword:
      return "NeverKeyword"
    case ts.SyntaxKind.ReadonlyKeyword:
      return "ReadonlyKeyword"
    case ts.SyntaxKind.RequireKeyword:
      return "RequireKeyword"
    case ts.SyntaxKind.NumberKeyword:
      return "NumberKeyword"
    case ts.SyntaxKind.ObjectKeyword:
      return "ObjectKeyword"
    case ts.SyntaxKind.SetKeyword:
      return "SetKeyword"
    case ts.SyntaxKind.StringKeyword:
      return "StringKeyword"
    case ts.SyntaxKind.SymbolKeyword:
      return "SymbolKeyword"
    case ts.SyntaxKind.TypeKeyword:
      return "TypeKeyword"
    case ts.SyntaxKind.UndefinedKeyword:
      return "UndefinedKeyword"
    case ts.SyntaxKind.UniqueKeyword:
      return "UniqueKeyword"
    case ts.SyntaxKind.UnknownKeyword:
      return "UnknownKeyword"
    case ts.SyntaxKind.FromKeyword:
      return "FromKeyword"
    case ts.SyntaxKind.GlobalKeyword:
      return "GlobalKeyword"
    case ts.SyntaxKind.BigIntKeyword:
      return "BigIntKeyword"
    case ts.SyntaxKind.OverrideKeyword:
      return "OverrideKeyword"
    case ts.SyntaxKind.OfKeyword:
      return "OfKeyword"
    case ts.SyntaxKind.QualifiedName:
      return "QualifiedName"
    case ts.SyntaxKind.ComputedPropertyName:
      return "ComputedPropertyName"
    case ts.SyntaxKind.TypeParameter:
      return "TypeParameter"
    case ts.SyntaxKind.Parameter:
      return "Parameter"
    case ts.SyntaxKind.Decorator:
      return "Decorator"
    case ts.SyntaxKind.PropertySignature:
      return "PropertySignature"
    case ts.SyntaxKind.PropertyDeclaration:
      return "PropertyDeclaration"
    case ts.SyntaxKind.MethodSignature:
      return "MethodSignature"
    case ts.SyntaxKind.MethodDeclaration:
      return "MethodDeclaration"
    case ts.SyntaxKind.ClassStaticBlockDeclaration:
      return "ClassStaticBlockDeclaration"
    case ts.SyntaxKind.Constructor:
      return "Constructor"
    case ts.SyntaxKind.GetAccessor:
      return "GetAccessor"
    case ts.SyntaxKind.SetAccessor:
      return "SetAccessor"
    case ts.SyntaxKind.CallSignature:
      return "CallSignature"
    case ts.SyntaxKind.ConstructSignature:
      return "ConstructSignature"
    case ts.SyntaxKind.IndexSignature:
      return "IndexSignature"
    case ts.SyntaxKind.TypePredicate:
      return "TypePredicate"
    case ts.SyntaxKind.TypeReference:
      return "TypeReference"
    case ts.SyntaxKind.FunctionType:
      return "FunctionType"
    case ts.SyntaxKind.ConstructorType:
      return "ConstructorType"
    case ts.SyntaxKind.TypeQuery:
      return "TypeQuery"
    case ts.SyntaxKind.TypeLiteral:
      return "TypeLiteral"
    case ts.SyntaxKind.ArrayType:
      return "ArrayType"
    case ts.SyntaxKind.TupleType:
      return "TupleType"
    case ts.SyntaxKind.OptionalType:
      return "OptionalType"
    case ts.SyntaxKind.RestType:
      return "RestType"
    case ts.SyntaxKind.UnionType:
      return "UnionType"
    case ts.SyntaxKind.IntersectionType:
      return "IntersectionType"
    case ts.SyntaxKind.ConditionalType:
      return "ConditionalType"
    case ts.SyntaxKind.InferType:
      return "InferType"
    case ts.SyntaxKind.ParenthesizedType:
      return "ParenthesizedType"
    case ts.SyntaxKind.ThisType:
      return "ThisType"
    case ts.SyntaxKind.TypeOperator:
      return "TypeOperator"
    case ts.SyntaxKind.IndexedAccessType:
      return "IndexedAccessType"
    case ts.SyntaxKind.MappedType:
      return "MappedType"
    case ts.SyntaxKind.LiteralType:
      return "LiteralType"
    case ts.SyntaxKind.NamedTupleMember:
      return "NamedTupleMember"
    case ts.SyntaxKind.TemplateLiteralType:
      return "TemplateLiteralType"
    case ts.SyntaxKind.TemplateLiteralTypeSpan:
      return "TemplateLiteralTypeSpan"
    case ts.SyntaxKind.ImportType:
      return "ImportType"
    case ts.SyntaxKind.ObjectBindingPattern:
      return "ObjectBindingPattern"
    case ts.SyntaxKind.ArrayBindingPattern:
      return "ArrayBindingPattern"
    case ts.SyntaxKind.BindingElement:
      return "BindingElement"
    case ts.SyntaxKind.ArrayLiteralExpression:
      return "ArrayLiteralExpression"
    case ts.SyntaxKind.ObjectLiteralExpression:
      return "ObjectLiteralExpression"
    case ts.SyntaxKind.PropertyAccessExpression:
      return "PropertyAccessExpression"
    case ts.SyntaxKind.ElementAccessExpression:
      return "ElementAccessExpression"
    case ts.SyntaxKind.CallExpression:
      return "CallExpression"
    case ts.SyntaxKind.NewExpression:
      return "NewExpression"
    case ts.SyntaxKind.TaggedTemplateExpression:
      return "TaggedTemplateExpression"
    case ts.SyntaxKind.TypeAssertionExpression:
      return "TypeAssertionExpression"
    case ts.SyntaxKind.ParenthesizedExpression:
      return "ParenthesizedExpression"
    case ts.SyntaxKind.FunctionExpression:
      return "FunctionExpression"
    case ts.SyntaxKind.ArrowFunction:
      return "ArrowFunction"
    case ts.SyntaxKind.DeleteExpression:
      return "DeleteExpression"
    case ts.SyntaxKind.TypeOfExpression:
      return "TypeOfExpression"
    case ts.SyntaxKind.VoidExpression:
      return "VoidExpression"
    case ts.SyntaxKind.AwaitExpression:
      return "AwaitExpression"
    case ts.SyntaxKind.PrefixUnaryExpression:
      return "PrefixUnaryExpression"
    case ts.SyntaxKind.PostfixUnaryExpression:
      return "PostfixUnaryExpression"
    case ts.SyntaxKind.BinaryExpression:
      return "BinaryExpression"
    case ts.SyntaxKind.ConditionalExpression:
      return "ConditionalExpression"
    case ts.SyntaxKind.TemplateExpression:
      return "TemplateExpression"
    case ts.SyntaxKind.YieldExpression:
      return "YieldExpression"
    case ts.SyntaxKind.SpreadElement:
      return "SpreadElement"
    case ts.SyntaxKind.ClassExpression:
      return "ClassExpression"
    case ts.SyntaxKind.OmittedExpression:
      return "OmittedExpression"
    case ts.SyntaxKind.ExpressionWithTypeArguments:
      return "ExpressionWithTypeArguments"
    case ts.SyntaxKind.AsExpression:
      return "AsExpression"
    case ts.SyntaxKind.NonNullExpression:
      return "NonNullExpression"
    case ts.SyntaxKind.MetaProperty:
      return "MetaProperty"
    case ts.SyntaxKind.SyntheticExpression:
      return "SyntheticExpression"
    case ts.SyntaxKind.TemplateSpan:
      return "TemplateSpan"
    case ts.SyntaxKind.SemicolonClassElement:
      return "SemicolonClassElement"
    case ts.SyntaxKind.Block:
      return "Block"
    case ts.SyntaxKind.EmptyStatement:
      return "EmptyStatement"
    case ts.SyntaxKind.VariableStatement:
      return "VariableStatement"
    case ts.SyntaxKind.ExpressionStatement:
      return "ExpressionStatement"
    case ts.SyntaxKind.IfStatement:
      return "IfStatement"
    case ts.SyntaxKind.DoStatement:
      return "DoStatement"
    case ts.SyntaxKind.WhileStatement:
      return "WhileStatement"
    case ts.SyntaxKind.ForStatement:
      return "ForStatement"
    case ts.SyntaxKind.ForInStatement:
      return "ForInStatement"
    case ts.SyntaxKind.ForOfStatement:
      return "ForOfStatement"
    case ts.SyntaxKind.ContinueStatement:
      return "ContinueStatement"
    case ts.SyntaxKind.BreakStatement:
      return "BreakStatement"
    case ts.SyntaxKind.ReturnStatement:
      return "ReturnStatement"
    case ts.SyntaxKind.WithStatement:
      return "WithStatement"
    case ts.SyntaxKind.SwitchStatement:
      return "SwitchStatement"
    case ts.SyntaxKind.LabeledStatement:
      return "LabeledStatement"
    case ts.SyntaxKind.ThrowStatement:
      return "ThrowStatement"
    case ts.SyntaxKind.TryStatement:
      return "TryStatement"
    case ts.SyntaxKind.DebuggerStatement:
      return "DebuggerStatement"
    case ts.SyntaxKind.VariableDeclaration:
      return "VariableDeclaration"
    case ts.SyntaxKind.VariableDeclarationList:
      return "VariableDeclarationList"
    case ts.SyntaxKind.FunctionDeclaration:
      return "FunctionDeclaration"
    case ts.SyntaxKind.ClassDeclaration:
      return "ClassDeclaration"
    case ts.SyntaxKind.InterfaceDeclaration:
      return "InterfaceDeclaration"
    case ts.SyntaxKind.TypeAliasDeclaration:
      return "TypeAliasDeclaration"
    case ts.SyntaxKind.EnumDeclaration:
      return "EnumDeclaration"
    case ts.SyntaxKind.ModuleDeclaration:
      return "ModuleDeclaration"
    case ts.SyntaxKind.ModuleBlock:
      return "ModuleBlock"
    case ts.SyntaxKind.CaseBlock:
      return "CaseBlock"
    case ts.SyntaxKind.NamespaceExportDeclaration:
      return "NamespaceExportDeclaration"
    case ts.SyntaxKind.ImportEqualsDeclaration:
      return "ImportEqualsDeclaration"
    case ts.SyntaxKind.ImportDeclaration:
      return "ImportDeclaration"
    case ts.SyntaxKind.ImportClause:
      return "ImportClause"
    case ts.SyntaxKind.NamespaceImport:
      return "NamespaceImport"
    case ts.SyntaxKind.NamedImports:
      return "NamedImports"
    case ts.SyntaxKind.ImportSpecifier:
      return "ImportSpecifier"
    case ts.SyntaxKind.ExportAssignment:
      return "ExportAssignment"
    case ts.SyntaxKind.ExportDeclaration:
      return "ExportDeclaration"
    case ts.SyntaxKind.NamedExports:
      return "NamedExports"
    case ts.SyntaxKind.NamespaceExport:
      return "NamespaceExport"
    case ts.SyntaxKind.ExportSpecifier:
      return "ExportSpecifier"
    case ts.SyntaxKind.MissingDeclaration:
      return "MissingDeclaration"
    case ts.SyntaxKind.ExternalModuleReference:
      return "ExternalModuleReference"
    case ts.SyntaxKind.JsxElement:
      return "JsxElement"
    case ts.SyntaxKind.JsxSelfClosingElement:
      return "JsxSelfClosingElement"
    case ts.SyntaxKind.JsxOpeningElement:
      return "JsxOpeningElement"
    case ts.SyntaxKind.JsxClosingElement:
      return "JsxClosingElement"
    case ts.SyntaxKind.JsxFragment:
      return "JsxFragment"
    case ts.SyntaxKind.JsxOpeningFragment:
      return "JsxOpeningFragment"
    case ts.SyntaxKind.JsxClosingFragment:
      return "JsxClosingFragment"
    case ts.SyntaxKind.JsxAttribute:
      return "JsxAttribute"
    case ts.SyntaxKind.JsxAttributes:
      return "JsxAttributes"
    case ts.SyntaxKind.JsxSpreadAttribute:
      return "JsxSpreadAttribute"
    case ts.SyntaxKind.JsxExpression:
      return "JsxExpression"
    case ts.SyntaxKind.CaseClause:
      return "CaseClause"
    case ts.SyntaxKind.DefaultClause:
      return "DefaultClause"
    case ts.SyntaxKind.HeritageClause:
      return "HeritageClause"
    case ts.SyntaxKind.CatchClause:
      return "CatchClause"
    case ts.SyntaxKind.AssertClause:
      return "AssertClause"
    case ts.SyntaxKind.AssertEntry:
      return "AssertEntry"
    case ts.SyntaxKind.PropertyAssignment:
      return "PropertyAssignment"
    case ts.SyntaxKind.ShorthandPropertyAssignment:
      return "ShorthandPropertyAssignment"
    case ts.SyntaxKind.SpreadAssignment:
      return "SpreadAssignment"
    case ts.SyntaxKind.EnumMember:
      return "EnumMember"
    case ts.SyntaxKind.UnparsedPrologue:
      return "UnparsedPrologue"
    case ts.SyntaxKind.UnparsedPrepend:
      return "UnparsedPrepend"
    case ts.SyntaxKind.UnparsedText:
      return "UnparsedText"
    case ts.SyntaxKind.UnparsedInternalText:
      return "UnparsedInternalText"
    case ts.SyntaxKind.UnparsedSyntheticReference:
      return "UnparsedSyntheticReference"
    case ts.SyntaxKind.SourceFile:
      return "SourceFile"
    case ts.SyntaxKind.Bundle:
      return "Bundle"
    case ts.SyntaxKind.UnparsedSource:
      return "UnparsedSource"
    case ts.SyntaxKind.InputFiles:
      return "InputFiles"
    case ts.SyntaxKind.JSDocTypeExpression:
      return "JSDocTypeExpression"
    case ts.SyntaxKind.JSDocNameReference:
      return "JSDocNameReference"
    case ts.SyntaxKind.JSDocMemberName:
      return "JSDocMemberName"
    case ts.SyntaxKind.JSDocAllType:
      return "JSDocAllType"
    case ts.SyntaxKind.JSDocUnknownType:
      return "JSDocUnknownType"
    case ts.SyntaxKind.JSDocNullableType:
      return "JSDocNullableType"
    case ts.SyntaxKind.JSDocNonNullableType:
      return "JSDocNonNullableType"
    case ts.SyntaxKind.JSDocOptionalType:
      return "JSDocOptionalType"
    case ts.SyntaxKind.JSDocFunctionType:
      return "JSDocFunctionType"
    case ts.SyntaxKind.JSDocVariadicType:
      return "JSDocVariadicType"
    case ts.SyntaxKind.JSDocNamepathType:
      return "JSDocNamepathType"
    case ts.SyntaxKind.JSDocComment:
      return "JSDocComment"
    case ts.SyntaxKind.JSDocText:
      return "JSDocText"
    case ts.SyntaxKind.JSDocTypeLiteral:
      return "JSDocTypeLiteral"
    case ts.SyntaxKind.JSDocSignature:
      return "JSDocSignature"
    case ts.SyntaxKind.JSDocLink:
      return "JSDocLink"
    case ts.SyntaxKind.JSDocLinkCode:
      return "JSDocLinkCode"
    case ts.SyntaxKind.JSDocLinkPlain:
      return "JSDocLinkPlain"
    case ts.SyntaxKind.JSDocTag:
      return "JSDocTag"
    case ts.SyntaxKind.JSDocAugmentsTag:
      return "JSDocAugmentsTag"
    case ts.SyntaxKind.JSDocImplementsTag:
      return "JSDocImplementsTag"
    case ts.SyntaxKind.JSDocAuthorTag:
      return "JSDocAuthorTag"
    case ts.SyntaxKind.JSDocDeprecatedTag:
      return "JSDocDeprecatedTag"
    case ts.SyntaxKind.JSDocClassTag:
      return "JSDocClassTag"
    case ts.SyntaxKind.JSDocPublicTag:
      return "JSDocPublicTag"
    case ts.SyntaxKind.JSDocPrivateTag:
      return "JSDocPrivateTag"
    case ts.SyntaxKind.JSDocProtectedTag:
      return "JSDocProtectedTag"
    case ts.SyntaxKind.JSDocReadonlyTag:
      return "JSDocReadonlyTag"
    case ts.SyntaxKind.JSDocOverrideTag:
      return "JSDocOverrideTag"
    case ts.SyntaxKind.JSDocCallbackTag:
      return "JSDocCallbackTag"
    case ts.SyntaxKind.JSDocEnumTag:
      return "JSDocEnumTag"
    case ts.SyntaxKind.JSDocParameterTag:
      return "JSDocParameterTag"
    case ts.SyntaxKind.JSDocReturnTag:
      return "JSDocReturnTag"
    case ts.SyntaxKind.JSDocThisTag:
      return "JSDocThisTag"
    case ts.SyntaxKind.JSDocTypeTag:
      return "JSDocTypeTag"
    case ts.SyntaxKind.JSDocTemplateTag:
      return "JSDocTemplateTag"
    case ts.SyntaxKind.JSDocTypedefTag:
      return "JSDocTypedefTag"
    case ts.SyntaxKind.JSDocSeeTag:
      return "JSDocSeeTag"
    case ts.SyntaxKind.JSDocPropertyTag:
      return "JSDocPropertyTag"
    case ts.SyntaxKind.SyntaxList:
      return "SyntaxList"
    case ts.SyntaxKind.NotEmittedStatement:
      return "NotEmittedStatement"
    case ts.SyntaxKind.PartiallyEmittedExpression:
      return "PartiallyEmittedExpression"
    case ts.SyntaxKind.CommaListExpression:
      return "CommaListExpression"
    case ts.SyntaxKind.MergeDeclarationMarker:
      return "MergeDeclarationMarker"
    case ts.SyntaxKind.EndOfDeclarationMarker:
      return "EndOfDeclarationMarker"
    case ts.SyntaxKind.SyntheticReferenceExpression:
      return "SyntheticReferenceExpression"
    case ts.SyntaxKind.Count:
      return "Count"
    case ts.SyntaxKind.FirstAssignment:
      return "FirstAssignment"
    case ts.SyntaxKind.LastAssignment:
      return "LastAssignment"
    case ts.SyntaxKind.FirstCompoundAssignment:
      return "FirstCompoundAssignment"
    case ts.SyntaxKind.LastCompoundAssignment:
      return "LastCompoundAssignment"
    case ts.SyntaxKind.FirstReservedWord:
      return "FirstReservedWord"
    case ts.SyntaxKind.LastReservedWord:
      return "LastReservedWord"
    case ts.SyntaxKind.FirstKeyword:
      return "FirstKeyword"
    case ts.SyntaxKind.LastKeyword:
      return "LastKeyword"
    case ts.SyntaxKind.FirstFutureReservedWord:
      return "FirstFutureReservedWord"
    case ts.SyntaxKind.LastFutureReservedWord:
      return "LastFutureReservedWord"
    case ts.SyntaxKind.FirstTypeNode:
      return "FirstTypeNode"
    case ts.SyntaxKind.LastTypeNode:
      return "LastTypeNode"
    case ts.SyntaxKind.FirstPunctuation:
      return "FirstPunctuation"
    case ts.SyntaxKind.LastPunctuation:
      return "LastPunctuation"
    case ts.SyntaxKind.FirstToken:
      return "FirstToken"
    case ts.SyntaxKind.LastToken:
      return "LastToken"
    case ts.SyntaxKind.FirstTriviaToken:
      return "FirstTriviaToken"
    case ts.SyntaxKind.LastTriviaToken:
      return "LastTriviaToken"
    case ts.SyntaxKind.FirstLiteralToken:
      return "FirstLiteralToken"
    case ts.SyntaxKind.LastLiteralToken:
      return "LastLiteralToken"
    case ts.SyntaxKind.FirstTemplateToken:
      return "FirstTemplateToken"
    case ts.SyntaxKind.LastTemplateToken:
      return "LastTemplateToken"
    case ts.SyntaxKind.FirstBinaryOperator:
      return "FirstBinaryOperator"
    case ts.SyntaxKind.LastBinaryOperator:
      return "LastBinaryOperator"
    case ts.SyntaxKind.FirstStatement:
      return "FirstStatement"
    case ts.SyntaxKind.LastStatement:
      return "LastStatement"
    case ts.SyntaxKind.FirstNode:
      return "FirstNode"
    case ts.SyntaxKind.FirstJSDocNode:
      return "FirstJSDocNode"
    case ts.SyntaxKind.LastJSDocNode:
      return "LastJSDocNode"
    case ts.SyntaxKind.FirstJSDocTagNode:
      return "FirstJSDocTagNode"
    case ts.SyntaxKind.LastJSDocTagNode:
      return "LastJSDocTagNode"
  }
}
