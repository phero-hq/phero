import ts from "typescript"

interface KindToNodeMappings {
  [kind: number]: ts.Node
  [ts.SyntaxKind.SourceFile]: ts.SourceFile
  [ts.SyntaxKind.ArrayBindingPattern]: ts.ArrayBindingPattern
  [ts.SyntaxKind.ArrayLiteralExpression]: ts.ArrayLiteralExpression
  [ts.SyntaxKind.ArrayType]: ts.ArrayTypeNode
  [ts.SyntaxKind.ArrowFunction]: ts.ArrowFunction
  [ts.SyntaxKind.AsExpression]: ts.AsExpression
  [ts.SyntaxKind.AwaitExpression]: ts.AwaitExpression
  [ts.SyntaxKind.BigIntLiteral]: ts.BigIntLiteral
  [ts.SyntaxKind.BindingElement]: ts.BindingElement
  [ts.SyntaxKind.BinaryExpression]: ts.BinaryExpression
  [ts.SyntaxKind.Block]: ts.Block
  [ts.SyntaxKind.BreakStatement]: ts.BreakStatement
  [ts.SyntaxKind.CallExpression]: ts.CallExpression
  [ts.SyntaxKind.CallSignature]: ts.CallSignatureDeclaration
  [ts.SyntaxKind.CaseBlock]: ts.CaseBlock
  [ts.SyntaxKind.CaseClause]: ts.CaseClause
  [ts.SyntaxKind.CatchClause]: ts.CatchClause
  [ts.SyntaxKind.ClassDeclaration]: ts.ClassDeclaration
  [ts.SyntaxKind.ClassExpression]: ts.ClassExpression
  [ts.SyntaxKind.ClassStaticBlockDeclaration]: ts.ClassStaticBlockDeclaration
  [ts.SyntaxKind.ConditionalType]: ts.ConditionalTypeNode
  [ts.SyntaxKind.Constructor]: ts.ConstructorDeclaration
  [ts.SyntaxKind.ConstructorType]: ts.ConstructorTypeNode
  [ts.SyntaxKind.ConstructSignature]: ts.ConstructSignatureDeclaration
  [ts.SyntaxKind.ContinueStatement]: ts.ContinueStatement
  [ts.SyntaxKind.CommaListExpression]: ts.CommaListExpression
  [ts.SyntaxKind.ComputedPropertyName]: ts.ComputedPropertyName
  [ts.SyntaxKind.ConditionalExpression]: ts.ConditionalExpression
  [ts.SyntaxKind.DebuggerStatement]: ts.DebuggerStatement
  [ts.SyntaxKind.Decorator]: ts.Decorator
  [ts.SyntaxKind.DefaultClause]: ts.DefaultClause
  [ts.SyntaxKind.DeleteExpression]: ts.DeleteExpression
  [ts.SyntaxKind.DoStatement]: ts.DoStatement
  [ts.SyntaxKind.ElementAccessExpression]: ts.ElementAccessExpression
  [ts.SyntaxKind.EmptyStatement]: ts.EmptyStatement
  [ts.SyntaxKind.EnumDeclaration]: ts.EnumDeclaration
  [ts.SyntaxKind.EnumMember]: ts.EnumMember
  [ts.SyntaxKind.ExportAssignment]: ts.ExportAssignment
  [ts.SyntaxKind.ExportDeclaration]: ts.ExportDeclaration
  [ts.SyntaxKind.ExportSpecifier]: ts.ExportSpecifier
  [ts.SyntaxKind.ExpressionWithTypeArguments]: ts.ExpressionWithTypeArguments
  [ts.SyntaxKind.ExpressionStatement]: ts.ExpressionStatement
  [ts.SyntaxKind.ExternalModuleReference]: ts.ExternalModuleReference
  [ts.SyntaxKind.QualifiedName]: ts.QualifiedName
  [ts.SyntaxKind.ForInStatement]: ts.ForInStatement
  [ts.SyntaxKind.ForOfStatement]: ts.ForOfStatement
  [ts.SyntaxKind.ForStatement]: ts.ForStatement
  [ts.SyntaxKind.FunctionDeclaration]: ts.FunctionDeclaration
  [ts.SyntaxKind.FunctionExpression]: ts.FunctionExpression
  [ts.SyntaxKind.FunctionType]: ts.FunctionTypeNode
  [ts.SyntaxKind.GetAccessor]: ts.GetAccessorDeclaration
  [ts.SyntaxKind.HeritageClause]: ts.HeritageClause
  [ts.SyntaxKind.Identifier]: ts.Identifier
  [ts.SyntaxKind.IfStatement]: ts.IfStatement
  [ts.SyntaxKind.ImportClause]: ts.ImportClause
  [ts.SyntaxKind.ImportDeclaration]: ts.ImportDeclaration
  [ts.SyntaxKind.ImportEqualsDeclaration]: ts.ImportEqualsDeclaration
  [ts.SyntaxKind.ImportSpecifier]: ts.ImportSpecifier
  [ts.SyntaxKind.ImportType]: ts.ImportTypeNode
  [ts.SyntaxKind.IndexedAccessType]: ts.IndexedAccessTypeNode
  [ts.SyntaxKind.IndexSignature]: ts.IndexSignatureDeclaration
  [ts.SyntaxKind.InferType]: ts.InferTypeNode
  [ts.SyntaxKind.InterfaceDeclaration]: ts.InterfaceDeclaration
  [ts.SyntaxKind.IntersectionType]: ts.IntersectionTypeNode
  [ts.SyntaxKind.JSDocAugmentsTag]: ts.JSDocAugmentsTag
  [ts.SyntaxKind.JSDocAuthorTag]: ts.JSDocAuthorTag
  [ts.SyntaxKind.JSDocCallbackTag]: ts.JSDocCallbackTag
  [ts.SyntaxKind.JSDocClassTag]: ts.JSDocClassTag
  [ts.SyntaxKind.JSDocDeprecatedTag]: ts.JSDocDeprecatedTag
  [ts.SyntaxKind.JSDocEnumTag]: ts.JSDocEnumTag
  [ts.SyntaxKind.JSDocFunctionType]: ts.JSDocFunctionType
  [ts.SyntaxKind.JSDocImplementsTag]: ts.JSDocImplementsTag
  [ts.SyntaxKind.JSDocLink]: ts.JSDocLink
  [ts.SyntaxKind.JSDocLinkCode]: ts.JSDocLinkCode
  [ts.SyntaxKind.JSDocLinkPlain]: ts.JSDocLinkPlain
  [ts.SyntaxKind.JSDocMemberName]: ts.JSDocMemberName
  [ts.SyntaxKind.JSDocOverrideTag]: ts.JSDocOverrideTag
  [ts.SyntaxKind.JSDocParameterTag]: ts.JSDocParameterTag
  [ts.SyntaxKind.JSDocPrivateTag]: ts.JSDocPrivateTag
  [ts.SyntaxKind.JSDocPropertyTag]: ts.JSDocPropertyTag
  [ts.SyntaxKind.JSDocProtectedTag]: ts.JSDocProtectedTag
  [ts.SyntaxKind.JSDocPublicTag]: ts.JSDocPublicTag
  [ts.SyntaxKind.JSDocReturnTag]: ts.JSDocReturnTag
  [ts.SyntaxKind.JSDocReadonlyTag]: ts.JSDocReadonlyTag
  [ts.SyntaxKind.JSDocSeeTag]: ts.JSDocSeeTag
  [ts.SyntaxKind.JSDocSignature]: ts.JSDocSignature
  [ts.SyntaxKind.JSDocTag]: ts.JSDocUnknownTag
  [ts.SyntaxKind.JSDocTemplateTag]: ts.JSDocTemplateTag
  [ts.SyntaxKind.JSDocText]: ts.JSDocText
  [ts.SyntaxKind.JSDocThisTag]: ts.JSDocThisTag
  [ts.SyntaxKind.JSDocTypeExpression]: ts.JSDocTypeExpression
  [ts.SyntaxKind.JSDocTypeTag]: ts.JSDocTypeTag
  [ts.SyntaxKind.JSDocTypedefTag]: ts.JSDocTypedefTag
  [ts.SyntaxKind.JsxAttribute]: ts.JsxAttribute
  [ts.SyntaxKind.JsxClosingElement]: ts.JsxClosingElement
  [ts.SyntaxKind.JsxClosingFragment]: ts.JsxClosingFragment
  [ts.SyntaxKind.JsxElement]: ts.JsxElement
  [ts.SyntaxKind.JsxExpression]: ts.JsxExpression
  [ts.SyntaxKind.JsxFragment]: ts.JsxFragment
  [ts.SyntaxKind.JsxOpeningElement]: ts.JsxOpeningElement
  [ts.SyntaxKind.JsxOpeningFragment]: ts.JsxOpeningFragment
  [ts.SyntaxKind.JsxSelfClosingElement]: ts.JsxSelfClosingElement
  [ts.SyntaxKind.JsxSpreadAttribute]: ts.JsxSpreadAttribute
  [ts.SyntaxKind.JsxText]: ts.JsxText
  [ts.SyntaxKind.LabeledStatement]: ts.LabeledStatement
  [ts.SyntaxKind.LiteralType]: ts.LiteralTypeNode
  [ts.SyntaxKind.MappedType]: ts.MappedTypeNode
  [ts.SyntaxKind.MetaProperty]: ts.MetaProperty
  [ts.SyntaxKind.MethodDeclaration]: ts.MethodDeclaration
  [ts.SyntaxKind.MethodSignature]: ts.MethodSignature
  [ts.SyntaxKind.ModuleBlock]: ts.ModuleBlock
  [ts.SyntaxKind.ModuleDeclaration]: ts.ModuleDeclaration
  [ts.SyntaxKind.NamedExports]: ts.NamedExports
  [ts.SyntaxKind.NamedImports]: ts.NamedImports
  [ts.SyntaxKind.NamedTupleMember]: ts.NamedTupleMember
  [ts.SyntaxKind.NamespaceExport]: ts.NamespaceExport
  [ts.SyntaxKind.NamespaceImport]: ts.NamespaceImport
  [ts.SyntaxKind.NewExpression]: ts.NewExpression
  [ts.SyntaxKind.NonNullExpression]: ts.NonNullExpression
  [ts.SyntaxKind.NotEmittedStatement]: ts.NotEmittedStatement
  [ts.SyntaxKind
    .NoSubstitutionTemplateLiteral]: ts.NoSubstitutionTemplateLiteral
  [ts.SyntaxKind.NumericLiteral]: ts.NumericLiteral
  [ts.SyntaxKind.ObjectBindingPattern]: ts.ObjectBindingPattern
  [ts.SyntaxKind.ObjectLiteralExpression]: ts.ObjectLiteralExpression
  [ts.SyntaxKind.OmittedExpression]: ts.OmittedExpression
  [ts.SyntaxKind.Parameter]: ts.ParameterDeclaration
  [ts.SyntaxKind.ParenthesizedExpression]: ts.ParenthesizedExpression
  [ts.SyntaxKind.ParenthesizedType]: ts.ParenthesizedTypeNode
  [ts.SyntaxKind.PartiallyEmittedExpression]: ts.PartiallyEmittedExpression
  [ts.SyntaxKind.PostfixUnaryExpression]: ts.PostfixUnaryExpression
  [ts.SyntaxKind.PrefixUnaryExpression]: ts.PrefixUnaryExpression
  [ts.SyntaxKind.PrivateIdentifier]: ts.PrivateIdentifier
  [ts.SyntaxKind.PropertyAccessExpression]: ts.PropertyAccessExpression
  [ts.SyntaxKind.PropertyAssignment]: ts.PropertyAssignment
  [ts.SyntaxKind.PropertyDeclaration]: ts.PropertyDeclaration
  [ts.SyntaxKind.PropertySignature]: ts.PropertySignature
  [ts.SyntaxKind.RegularExpressionLiteral]: ts.RegularExpressionLiteral
  [ts.SyntaxKind.ReturnStatement]: ts.ReturnStatement
  [ts.SyntaxKind.SetAccessor]: ts.SetAccessorDeclaration
  [ts.SyntaxKind.ShorthandPropertyAssignment]: ts.ShorthandPropertyAssignment
  [ts.SyntaxKind.SpreadAssignment]: ts.SpreadAssignment
  [ts.SyntaxKind.SpreadElement]: ts.SpreadElement
  [ts.SyntaxKind.StringLiteral]: ts.StringLiteral
  [ts.SyntaxKind.SwitchStatement]: ts.SwitchStatement
  [ts.SyntaxKind.SyntaxList]: ts.SyntaxList
  [ts.SyntaxKind.TaggedTemplateExpression]: ts.TaggedTemplateExpression
  [ts.SyntaxKind.TemplateExpression]: ts.TemplateExpression
  [ts.SyntaxKind.TemplateHead]: ts.TemplateHead
  [ts.SyntaxKind.TemplateLiteralType]: ts.TemplateLiteralTypeNode
  [ts.SyntaxKind.TemplateMiddle]: ts.TemplateMiddle
  [ts.SyntaxKind.TemplateSpan]: ts.TemplateSpan
  [ts.SyntaxKind.TemplateTail]: ts.TemplateTail
  [ts.SyntaxKind.ThisType]: ts.ThisTypeNode
  [ts.SyntaxKind.ThrowStatement]: ts.ThrowStatement
  [ts.SyntaxKind.TryStatement]: ts.TryStatement
  [ts.SyntaxKind.TupleType]: ts.TupleTypeNode
  [ts.SyntaxKind.TypeAliasDeclaration]: ts.TypeAliasDeclaration
  [ts.SyntaxKind.TypeAssertionExpression]: ts.TypeAssertion
  [ts.SyntaxKind.TypeLiteral]: ts.TypeLiteralNode
  [ts.SyntaxKind.TypeOperator]: ts.TypeOperatorNode
  [ts.SyntaxKind.TypeParameter]: ts.TypeParameterDeclaration
  [ts.SyntaxKind.TypePredicate]: ts.TypePredicateNode
  [ts.SyntaxKind.TypeQuery]: ts.TypeQueryNode
  [ts.SyntaxKind.TypeReference]: ts.TypeReferenceNode
  [ts.SyntaxKind.UnionType]: ts.UnionTypeNode
  [ts.SyntaxKind.VariableDeclaration]: ts.VariableDeclaration
  [ts.SyntaxKind.VariableDeclarationList]: ts.VariableDeclarationList
  [ts.SyntaxKind.VariableStatement]: ts.VariableStatement
  [ts.SyntaxKind.JSDocComment]: ts.JSDoc
  [ts.SyntaxKind.TypeOfExpression]: ts.TypeOfExpression
  [ts.SyntaxKind.WhileStatement]: ts.WhileStatement
  [ts.SyntaxKind.WithStatement]: ts.WithStatement
  [ts.SyntaxKind.YieldExpression]: ts.YieldExpression
  [ts.SyntaxKind.SemicolonToken]: ts.Token<ts.SyntaxKind.SemicolonToken>
  [ts.SyntaxKind.InferKeyword]: ts.Token<ts.SyntaxKind.InferKeyword>
  [ts.SyntaxKind.NeverKeyword]: ts.Token<ts.SyntaxKind.NeverKeyword>
  [ts.SyntaxKind.AnyKeyword]: ts.Expression
  [ts.SyntaxKind.BooleanKeyword]: ts.Expression
  [ts.SyntaxKind.NumberKeyword]: ts.Expression
  [ts.SyntaxKind.ObjectKeyword]: ts.Expression
  [ts.SyntaxKind.StringKeyword]: ts.Expression
  [ts.SyntaxKind.SymbolKeyword]: ts.Expression
  [ts.SyntaxKind.UndefinedKeyword]: ts.Expression
  [ts.SyntaxKind.FalseKeyword]: ts.FalseLiteral
  [ts.SyntaxKind.ImportKeyword]: ts.ImportExpression
  [ts.SyntaxKind.NullKeyword]: ts.NullLiteral
  [ts.SyntaxKind.SuperKeyword]: ts.SuperExpression
  [ts.SyntaxKind.ThisKeyword]: ts.ThisExpression
  [ts.SyntaxKind.TrueKeyword]: ts.TrueLiteral
  [ts.SyntaxKind.VoidExpression]: ts.VoidExpression
}

export function getChildrenOfKind<TKind extends ts.SyntaxKind>(
  node: ts.Node[] | ts.Node | undefined,
  kind: TKind,
): KindToNodeMappings[TKind][] {
  const children =
    node === undefined
      ? []
      : node instanceof Array
      ? node.flatMap((n) => n.getChildren())
      : node.getChildren()

  return children.reduce((result, child) => {
    return child.kind === kind
      ? [...result, child as KindToNodeMappings[TKind]]
      : result
  }, [] as KindToNodeMappings[TKind][])
}

export function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return node.modifiers?.some((m) => m.kind === kind) ?? false
}

export function getFirstChildOfKind<TKind extends ts.SyntaxKind>(
  node: ts.Node | undefined,
  kind: TKind,
): KindToNodeMappings[TKind] | undefined {
  const children = node === undefined ? [] : node.getChildren()

  return children.find((child) => child.kind === kind) as
    | KindToNodeMappings[TKind]
    | undefined
}

export function resolveSymbol(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ts.Symbol | undefined {
  const symbol = node && typeChecker.getSymbolAtLocation(node)
  if (
    symbol &&
    (symbol.flags & ts.SymbolFlags.Alias) === ts.SymbolFlags.Alias
  ) {
    return typeChecker.getAliasedSymbol(symbol)
  }
  return symbol
}
