import React from "react"
import ts from "typescript"

import { generateAny, TSAny, TSAnyElement } from "./ts-any"
import { generateArray, TSArray, TSArrayElement } from "./ts-array"
import {
  generateArrowFunction,
  TSArrowFunction,
  TSArrowFunctionElement,
} from "./ts-arrow-function"
import { generateAwait, TSAwait, TSAwaitElement } from "./ts-await"
import {
  generateBinaryExpression,
  TSBinaryExpression,
  TSBinaryExpressionElement,
} from "./ts-binary-expression"
import { generateBlock, TSBlock, TSBlockElement } from "./ts-block"
import { generateBoolean, TSBoolean, TSBooleanElement } from "./ts-boolean"
import {
  generateCallExpression,
  TSCallExpression,
  TSCallExpressionElement,
} from "./ts-call-expression"
import { generateConst, TSConst, TSConstElement } from "./ts-const"
import { generateFalse, TSFalse, TSFalseElement } from "./ts-false"
import { generateFunction, TSFunction, TSFunctionElement } from "./ts-function"
import { generateIf, TSIf, TSIfElement } from "./ts-if"
import { generateImport, TSImport, TSImportElement } from "./ts-import"
import {
  generateInterface,
  TSInterface,
  TSInterfaceElement,
} from "./ts-interface"
import {
  generateLiteralType,
  TSLiteralType,
  TSLiteralTypeElement,
} from "./ts-literal-type"
import { generateNull, TSNull, TSNullElement } from "./ts-null"
import { generateNumber, TSNumber, TSNumberElement } from "./ts-number"
import {
  generateNumberLiteral,
  TSNumberLiteral,
  TSNumberLiteralElement,
} from "./ts-number-literal"
import {
  generateObjectLiteral,
  TSObjectLiteral,
  TSObjectLiteralElement,
} from "./ts-object-literal"
import {
  generateParameter,
  TSParameter,
  TSParameterElement,
} from "./ts-parameter"
import { generateBundle, TSBundle, TSBundleElement } from "./ts-bundle"
import {
  generatePropertyAccessExpression,
  TSPropertyAccessExpression,
  TSPropertyAccessExpressionElement,
} from "./ts-property-access-expression"
import {
  generatePropertyAssignment,
  TSPropertyAssignment,
  TSPropertyAssignmentElement,
} from "./ts-property-assignment"
import {
  generatePropertySignature,
  TSPropertySignature,
  TSPropertySignatureElement,
} from "./ts-property-signature"
import { generateReturn, TSReturn, TSReturnElement } from "./ts-return"
import {
  generateShorthandPropertyAssignment,
  TSShorthandPropertyAssignment,
  TSShorthandPropertyAssignmentElement,
} from "./ts-shorthand-property-assignment"
import {
  generateSourceFile,
  TSSourceFile,
  TSSourceFileElement,
} from "./ts-source-file"
import { generateString, TSString, TSStringElement } from "./ts-string"
import {
  generateStringLiteral,
  TSStringLiteral,
  TSStringLiteralElement,
} from "./ts-string-literal"
import { generateTrue, TSTrue, TSTrueElement } from "./ts-true"
import {
  generateTry,
  TSCatch,
  TSCatchElement,
  TSFinally,
  TSFinallyElement,
  TSTry,
  TSTryElement,
} from "./ts-try"
import {
  generateTypeAlias,
  TSTypeAlias,
  TSTypeAliasElement,
} from "./ts-type-alias"
import {
  generateTypeLiteral,
  TSTypeLiteral,
  TSTypeLiteralElement,
} from "./ts-type-literal"
import {
  generateTypeParameter,
  TSTypeParameter,
  TSTypeParameterElement,
} from "./ts-type-parameter"
import {
  generateTypeReference,
  TSTypeReference,
  TSTypeReferenceElement,
} from "./ts-type-reference"
import {
  generateUndefined,
  TSUndefined,
  TSUndefinedElement,
} from "./ts-undefined"
import { generateUnion, TSUnion, TSUnionElement } from "./ts-union"
import { UnsupportedElementSupportedError } from "./utils"
import { TSRoot, TSRootElement } from "./ts-root"
import { generateNode, TSNode, TSNodeElement } from "./ts-node"

export type TSElements =
  | TSFunctionElement
  | TSParameterElement
  | TSImportElement
  | TSPropertyAssignmentElement
  | TSShorthandPropertyAssignmentElement
  | TSArrowFunctionElement
  | TSCallExpressionElement
  | TSBinaryExpressionElement
  | TSPropertyAccessExpressionElement
  | TSConstElement
  | TSBlockElement
  | TSIfElement
  | TSReturnElement
  | TSFalseElement
  | TSTrueElement
  | TSTypeReferenceElement
  | TSAnyElement
  | TSBooleanElement
  | TSNumberElement
  | TSStringElement
  | TSUndefinedElement
  | TSLiteralTypeElement
  | TSStringLiteralElement
  | TSNumberLiteralElement
  | TSNullElement
  | TSTryElement
  | TSCatchElement
  | TSFinallyElement
  | TSArrayElement
  | TSUnionElement
  | TSAwaitElement
  | TSTypeParameterElement
  | TSTypeAliasElement
  | TSSourceFileElement
  | TSInterfaceElement
  | TSTypeLiteralElement
  | TSPropertySignatureElement
  | TSBundleElement
  | TSRootElement
  | TSObjectLiteralElement
  | TSNodeElement

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ts-root": TSRoot
      "ts-bundle": TSBundle
      "ts-source-file": TSSourceFile
      "ts-node": TSNode

      // declaration
      "ts-function": TSFunction
      "ts-parameter": TSParameter
      "ts-import": TSImport
      "ts-property-assignment": TSPropertyAssignment
      "ts-shorthand-property-assignment": TSShorthandPropertyAssignment
      "ts-type-parameter": TSTypeParameter
      "ts-type-alias": TSTypeAlias
      "ts-interface": TSInterface
      "ts-type-literal": TSTypeLiteral
      "ts-property-signature": TSPropertySignature

      // expression
      "ts-arrow-function": TSArrowFunction
      "ts-call-expression": TSCallExpression
      "ts-binary-expression": TSBinaryExpression
      "ts-property-access-expression": TSPropertyAccessExpression
      "ts-await": TSAwait

      // statement
      "ts-const": TSConst
      "ts-block": TSBlock
      "ts-if": TSIf
      "ts-return": TSReturn
      "ts-try": TSTry
      "ts-catch": TSCatch
      "ts-finally": TSFinally

      // literal
      "ts-false": TSFalse
      "ts-true": TSTrue

      // type-node
      "ts-type-reference": TSTypeReference
      "ts-any": TSAny
      "ts-boolean": TSBoolean
      "ts-number": TSNumber
      "ts-string": TSString
      "ts-undefined": TSUndefined
      "ts-literal-type": TSLiteralType
      "ts-array": TSArray
      "ts-union": TSUnion

      // literals
      "ts-object-literal": TSObjectLiteral
      "ts-string-literal": TSStringLiteral
      "ts-number-literal": TSNumberLiteral
      "ts-null": TSNull
    }
  }
}

export interface TSElementTypeToSyntaxKind {
  [tag: string]: ts.SyntaxKind
  "ts-bundle": ts.SyntaxKind.Bundle
  "ts-source-file": ts.SyntaxKind.SourceFile

  // declaration
  "ts-function": ts.SyntaxKind.FunctionDeclaration
  "ts-parameter": ts.SyntaxKind.Parameter
  "ts-import": ts.SyntaxKind.ImportDeclaration
  "ts-property-assignment": ts.SyntaxKind.PropertyAssignment
  "ts-shorthand-property-assignment": ts.SyntaxKind.ShorthandPropertyAssignment
  "ts-type-parameter": ts.SyntaxKind.TypeParameter
  "ts-type-alias": ts.SyntaxKind.TypeAliasDeclaration
  "ts-interface": ts.SyntaxKind.InterfaceDeclaration
  "ts-type-literal": ts.SyntaxKind.TypeLiteral
  "ts-property-signature": ts.SyntaxKind.PropertySignature

  // expression
  "ts-arrow-function": ts.SyntaxKind.ArrowFunction
  "ts-call-expression": ts.SyntaxKind.CallExpression
  "ts-binary-expression": ts.SyntaxKind.BinaryExpression
  "ts-property-access-expression": ts.SyntaxKind.PropertyAccessExpression
  "ts-await": ts.SyntaxKind.AwaitExpression

  // statement
  "ts-const": ts.SyntaxKind.VariableStatement
  "ts-block": ts.SyntaxKind.Block
  "ts-if": ts.SyntaxKind.IfStatement
  "ts-return": ts.SyntaxKind.ReturnStatement
  "ts-try": ts.SyntaxKind.TryStatement
  "ts-catch": ts.SyntaxKind.CatchClause
  "ts-finally": ts.SyntaxKind.Block

  // literal
  "ts-false": ts.SyntaxKind.FalseKeyword
  "ts-true": ts.SyntaxKind.TrueKeyword

  // type-node
  "ts-type-reference": ts.SyntaxKind.TypeReference
  "ts-any": ts.SyntaxKind.AnyKeyword
  "ts-boolean": ts.SyntaxKind.BooleanKeyword
  "ts-number": ts.SyntaxKind.NumberKeyword
  "ts-string": ts.SyntaxKind.StringKeyword
  "ts-undefined": ts.SyntaxKind.UndefinedKeyword
  "ts-literal-type": ts.SyntaxKind.LiteralType
  "ts-array": ts.SyntaxKind.ArrayType
  "ts-union": ts.SyntaxKind.UnionType

  // literals
  "ts-object-literal": ts.SyntaxKind.ObjectLiteralExpression
  "ts-string-literal": ts.SyntaxKind.StringLiteral
  "ts-number-literal": ts.SyntaxKind.NumericLiteral
  "ts-null": ts.SyntaxKind.NullKeyword
}

export interface TSSyntaxKindToTSNodeMapping {
  [tag: number]: ts.Node

  [ts.SyntaxKind.Bundle]: ts.Bundle
  [ts.SyntaxKind.SourceFile]: ts.SourceFile

  // // declaration
  [ts.SyntaxKind.FunctionDeclaration]: ts.FunctionDeclaration
  [ts.SyntaxKind.Parameter]: ts.ParameterDeclaration
  [ts.SyntaxKind.ImportDeclaration]: ts.ImportDeclaration
  [ts.SyntaxKind.PropertyAssignment]: ts.PropertyAssignment
  [ts.SyntaxKind.ShorthandPropertyAssignment]: ts.ShorthandPropertyAssignment
  [ts.SyntaxKind.TypeParameter]: ts.TypeParameterDeclaration
  [ts.SyntaxKind.TypeAliasDeclaration]: ts.TypeAliasDeclaration
  [ts.SyntaxKind.InterfaceDeclaration]: ts.InterfaceDeclaration
  [ts.SyntaxKind.TypeLiteral]: ts.TypeLiteralNode
  [ts.SyntaxKind.PropertySignature]: ts.PropertySignature

  // // expression
  [ts.SyntaxKind.ArrowFunction]: ts.ArrowFunction
  [ts.SyntaxKind.CallExpression]: ts.CallExpression
  [ts.SyntaxKind.BinaryExpression]: ts.BinaryExpression
  [ts.SyntaxKind.PropertyAccessExpression]: ts.PropertyAccessExpression
  [ts.SyntaxKind.AwaitExpression]: ts.AwaitExpression

  // // statement
  [ts.SyntaxKind.VariableStatement]: ts.VariableStatement
  [ts.SyntaxKind.Block]: ts.Block
  [ts.SyntaxKind.IfStatement]: ts.IfStatement
  [ts.SyntaxKind.ReturnStatement]: ts.ReturnStatement
  [ts.SyntaxKind.TryStatement]: ts.TryStatement
  [ts.SyntaxKind.CatchClause]: ts.CatchClause
  [ts.SyntaxKind.FinallyKeyword]: ts.Block

  // // literal
  [ts.SyntaxKind.FalseKeyword]: ts.FalseLiteral
  [ts.SyntaxKind.TrueKeyword]: ts.TrueLiteral

  // // type-node
  [ts.SyntaxKind
    .BooleanKeyword]: ts.KeywordTypeNode<ts.SyntaxKind.BooleanKeyword>
  [ts.SyntaxKind.NumberKeyword]: ts.KeywordTypeNode<ts.SyntaxKind.NumberKeyword>
  [ts.SyntaxKind.StringKeyword]: ts.KeywordTypeNode<ts.SyntaxKind.StringKeyword>
  [ts.SyntaxKind
    .UndefinedKeyword]: ts.KeywordTypeNode<ts.SyntaxKind.UndefinedKeyword>
  [ts.SyntaxKind.ArrayType]: ts.ArrayTypeNode
  [ts.SyntaxKind.LiteralType]: ts.LiteralTypeNode
  [ts.SyntaxKind.ArrayType]: ts.ArrayTypeNode
  [ts.SyntaxKind.UnionType]: ts.UnionTypeNode
  [ts.SyntaxKind.TypeReference]: ts.TypeReferenceNode

  // // literals
  [ts.SyntaxKind.ObjectLiteralExpression]: ts.ObjectLiteralExpression
  [ts.SyntaxKind.StringLiteral]: ts.StringLiteral
  [ts.SyntaxKind.NumericLiteral]: ts.NumericLiteral
  [ts.SyntaxKind.NullKeyword]: ts.NullLiteral
}

export function generateAST<
  TSElement extends TSElements,
  TSNode = TSSyntaxKindToTSNodeMapping[TSElementTypeToSyntaxKind[TSElement["type"]]],
>(element: TSElement): TSNode {
  switch (element.type) {
    case "ts-root":
      return generateAST(element.props.children)

    case "ts-node":
      throw new Error("ts-node as root makes no sense")
    case "ts-bundle":
      return generateBundle(element) as unknown as TSNode
    case "ts-source-file":
      return generateSourceFile(element) as unknown as TSNode

    case "ts-function":
      return generateFunction(element) as unknown as TSNode
    case "ts-parameter":
      return generateParameter(element) as unknown as TSNode
    case "ts-import":
      return generateImport(element) as unknown as TSNode
    case "ts-property-assignment":
      return generatePropertyAssignment(element) as unknown as TSNode
    case "ts-shorthand-property-assignment":
      return generateShorthandPropertyAssignment(element) as unknown as TSNode
    case "ts-type-parameter":
      return generateTypeParameter(element) as unknown as TSNode
    case "ts-type-alias":
      return generateTypeAlias(element) as unknown as TSNode
    case "ts-interface":
      return generateInterface(element) as unknown as TSNode
    case "ts-type-literal":
      return generateTypeLiteral(element) as unknown as TSNode
    case "ts-property-signature":
      return generatePropertySignature(element) as unknown as TSNode

    case "ts-arrow-function":
      return generateArrowFunction(element) as unknown as TSNode
    case "ts-call-expression":
      return generateCallExpression(element) as unknown as TSNode
    case "ts-binary-expression":
      return generateBinaryExpression(element) as unknown as TSNode
    case "ts-property-access-expression":
      return generatePropertyAccessExpression(element) as unknown as TSNode
    case "ts-await":
      return generateAwait(element) as unknown as TSNode

    case "ts-const":
      return generateConst(element) as unknown as TSNode
    case "ts-block":
      return generateBlock(element) as unknown as TSNode
    case "ts-if":
      return generateIf(element) as unknown as TSNode
    case "ts-return":
      return generateReturn(element) as unknown as TSNode
    case "ts-try":
      return generateTry(element) as unknown as TSNode
    case "ts-catch":
    case "ts-finally":
      throw new Error("not implemented")

    case "ts-false":
      return generateFalse() as unknown as TSNode
    case "ts-true":
      return generateTrue() as unknown as TSNode

    case "ts-type-reference":
      return generateTypeReference(element) as unknown as TSNode
    case "ts-any":
      return generateAny() as unknown as TSNode
    case "ts-boolean":
      return generateBoolean() as unknown as TSNode
    case "ts-number":
      return generateNumber() as unknown as TSNode
    case "ts-string":
      return generateString() as unknown as TSNode
    case "ts-undefined":
      return generateUndefined() as unknown as TSNode
    case "ts-literal-type":
      return generateLiteralType(element) as unknown as TSNode
    case "ts-array":
      return generateArray(element) as unknown as TSNode
    case "ts-union":
      return generateUnion(element) as unknown as TSNode

    case "ts-object-literal":
      return generateObjectLiteral(element) as unknown as TSNode
    case "ts-string-literal":
      return generateStringLiteral(element) as unknown as TSNode
    case "ts-number-literal":
      return generateNumberLiteral(element) as unknown as TSNode
    case "ts-null":
      return generateNull() as unknown as TSNode

    case "ts-function":
      return generateFunction(element) as unknown as TSNode

    default:
      throw new UnsupportedElementSupportedError(element as any)
  }
}
