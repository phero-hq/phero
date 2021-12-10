import ts from "typescript"
import { ServerSource } from "../generateClient"
import { Model } from "../parseSamenApp"

const factory = ts.factory

export default function generateRPCProxy(serverSource: ServerSource): string {
  // const funcProxies = serverSource.services.flatMap(service => service.functions.map(func => generateFunctionProxy(service.name, func)))

  return ""
}

const exportModifier = factory.createModifier(ts.SyntaxKind.ExportKeyword)
const staticModifier = factory.createModifier(ts.SyntaxKind.StaticKeyword)

export function generateParser(
  model: Model,
  typeChecker: ts.TypeChecker,
): ts.ClassDeclaration {
  const modelName = model.name.escapedText
  return factory.createClassDeclaration(
    undefined,
    [exportModifier],
    `${modelName}Parser`,
    undefined,
    undefined,
    [
      factory.createMethodDeclaration(
        undefined,
        [staticModifier],
        undefined,
        "parse",
        undefined,
        undefined,
        [
          factory.createParameterDeclaration(
            undefined,
            undefined,
            undefined,
            dataParamName,
            undefined,
            factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
            undefined,
          ),
        ],
        factory.createTypeReferenceNode(
          factory.createIdentifier("ParseResult"),
          [factory.createTypeReferenceNode(model.name, undefined)],
        ),
        generateParserBody(model, typeChecker),
      ),
    ],
  )
}

/*


  interface Aad {
    x: string
    y: number
    z: {
      b: number
      c: boolean
      d?: boolean
    }
    x: {x: number}[]
  }


  type ParseResult<T> =
    | ParseResultSuccess<T>
    | ParseResultFailure

  interface ParseResultSuccess<T> {
    ok: true
    result: T
  }
  
  interface ParseResultFailure {
    ok: false
    errors: ValidationError[]
  }

  interface ValidationError {
    path: string
    message: string
  }

  

*/

/**
 * The same for each validator:
 *
 * if (!data) {
 *  return {
 *    ok: false,
 *    errors: [{path: ".", message: "data is invalid"}]
 *  }
 * }
 *
 */
const dataParamName = "data"

function generateParserBody(
  model: Model,
  typeChecker: ts.TypeChecker,
): ts.Block {
  const sts: ts.Statement[] = [
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier("errors"),
            undefined,
            factory.createArrayTypeNode(
              factory.createTypeReferenceNode(
                factory.createIdentifier("ValidationError"),
                undefined,
              ),
            ),
            factory.createArrayLiteralExpression([], false),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
  ]

  if (ts.isInterfaceDeclaration(model)) {
    sts.push(
      factory.createIfStatement(
        generateTypeofIsObjectAndIsNotNullExpression(
          factory.createIdentifier(dataParamName),
        ),
        generatePushErrorExpressionStatement(
          factory.createStringLiteral(dataParamName),
          "null or not an object",
        ),
        model.members.length
          ? factory.createBlock(
              model.members.flatMap((member) => {
                const node = new TSTypeElementNode(member, typeChecker)
                return generateTypeElementValidator(node)
              }),
            )
          : undefined,
      ),
    )
  }

  sts.push(
    factory.createIfStatement(
      factory.createPropertyAccessExpression(
        factory.createIdentifier("errors"),
        factory.createIdentifier("length"),
      ),
      factory.createBlock(
        [
          factory.createReturnStatement(
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier("ok"),
                  factory.createFalse(),
                ),
                factory.createShorthandPropertyAssignment(
                  factory.createIdentifier("errors"),
                  undefined,
                ),
              ],
              true,
            ),
          ),
        ],
        true,
      ),
      undefined,
    ),
    factory.createReturnStatement(
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            factory.createIdentifier("ok"),
            factory.createTrue(),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier("result"),
            factory.createAsExpression(
              factory.createIdentifier(dataParamName),
              factory.createTypeReferenceNode(model.name, undefined),
            ),
          ),
        ],
        true,
      ),
    ),
  )
  return factory.createBlock(sts, true)
}

abstract class TSNode {
  constructor(
    public readonly compilerNode: ts.Node,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent?: TSNode,
  ) {}

  abstract get name(): string

  private _ancestorsAndSelf?: TSNode[]
  private get ancestorsAndSelf(): TSNode[] {
    if (!this._ancestorsAndSelf) {
      let path: TSNode[] = []
      let node: TSNode | undefined = this
      while (node) {
        path = [node, ...path]
        node = node.parent
      }
      this._ancestorsAndSelf = path
    }
    return this._ancestorsAndSelf
  }

  private _refExpr?: ts.Expression
  public get refExpr(): ts.Expression {
    if (!this._refExpr) {
      this._refExpr = this.ancestorsAndSelf.reduce(
        (left: ts.Expression, node: TSNode) =>
          factory.createElementAccessExpression(
            left,
            node instanceof TSArrayElementNode
              ? factory.createIdentifier(node.name)
              : factory.createStringLiteral(node.name),
          ),
        factory.createIdentifier(dataParamName) as ts.Expression,
      )
    }

    return this._refExpr
  }

  private _errorPath?: ts.TemplateExpression | ts.StringLiteral
  public get errorPath(): ts.TemplateExpression | ts.StringLiteral {
    if (!this._errorPath) {
      const parentErrorPath = this.parent?.errorPath

      if (!parentErrorPath) {
        this._errorPath = factory.createStringLiteral(this.name)
      } else if (ts.isStringLiteral(parentErrorPath)) {
        if (this instanceof TSTypeElementNode) {
          this._errorPath = factory.createStringLiteral(
            `${parentErrorPath.text}.${this.name}`,
          )
        } else {
          this._errorPath = factory.createTemplateExpression(
            factory.createTemplateHead(`${parentErrorPath.text}[`),
            [
              factory.createTemplateSpan(
                factory.createIdentifier(this.name),
                factory.createTemplateTail(`]`),
              ),
            ],
          )
        }
      } else {
        const lastIndex = parentErrorPath.templateSpans.length - 1
        const previousSpans = parentErrorPath.templateSpans.slice(0, lastIndex)
        const lastSpan = parentErrorPath.templateSpans[lastIndex]
        if (this instanceof TSTypeElementNode) {
          this._errorPath = factory.createTemplateExpression(
            parentErrorPath.head,
            [
              ...previousSpans,
              factory.createTemplateSpan(
                lastSpan.expression,
                factory.createTemplateTail(
                  `${lastSpan.literal.text}.${this.name}`,
                ),
              ),
            ],
          )
        } else {
          this._errorPath = factory.createTemplateExpression(
            parentErrorPath.head,
            [
              ...previousSpans,
              factory.createTemplateSpan(
                lastSpan.expression,
                factory.createTemplateMiddle(`${lastSpan.literal.text}[`),
              ),
              factory.createTemplateSpan(
                factory.createIdentifier(this.name),
                factory.createTemplateTail(`]`),
              ),
            ],
          )
        }
      }
    }
    return this._errorPath
  }

  private _type?: ts.Type
  public get type(): ts.Type {
    if (!this._type) {
      if (ts.isPropertySignature(this.compilerNode) && this.compilerNode.type) {
        this._type = this.typeChecker.getTypeFromTypeNode(
          this.compilerNode.type,
        )
      } else if (ts.isTypeNode(this.compilerNode)) {
        this._type = this.typeChecker.getTypeFromTypeNode(this.compilerNode)
      } else {
        this._type = this.typeChecker.getTypeAtLocation(this.compilerNode)
      }
    }
    return this._type
  }

  private _typeNode?: ts.TypeNode
  public get typeNode(): ts.TypeNode | undefined {
    if (!this._typeNode) {
      if (ts.isPropertySignature(this.compilerNode) && this.compilerNode.type) {
        this._typeNode = this.compilerNode.type
      } else {
        this._typeNode = this.typeChecker.typeToTypeNode(
          this.type,
          this.compilerNode,
          undefined,
        )
      }
    }
    return this._typeNode
  }
}

class TSArrayElementNode extends TSNode {
  constructor(
    public readonly compilerNode: ts.TypeNode,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent: TSNode,
  ) {
    super(compilerNode, typeChecker, parent)
  }

  private _depth?: number
  public get depth(): number {
    if (!this._depth) {
      let i = 0
      let node: TSNode | undefined = this.parent
      while (node) {
        if (node instanceof TSArrayElementNode) {
          i++
        }
        node = node.parent
      }
      this._depth = i
    }
    return this._depth
  }

  public get name(): string {
    return `it_${this.depth}`
  }
}

class TSTypeElementNode extends TSNode {
  constructor(
    public readonly compilerNode: ts.TypeElement,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent?: TSNode,
  ) {
    super(compilerNode, typeChecker, parent)
  }

  public get name(): string {
    if (!this.compilerNode.name) {
      throw new Error("Oops, expected name for element")
    }

    if (ts.isIdentifier(this.compilerNode.name)) {
      return this.compilerNode.name.text
    }

    if (ts.isLiteralExpression(this.compilerNode.name)) {
      return this.compilerNode.name.text
    }

    return this.compilerNode.name.getText()
  }
}

///// DONE
// String = 4,
// Number = 8,
// Boolean = 16,
// StringLiteral = 128,
// NumberLiteral = 256,
// BooleanLiteral = 512,
// Undefined = 32768,
// Null = 65536,
// TypeParameter = 262144,
// Object = 524288,
// Union = 1048576,
// Intersection = 2097152,
// Index = 4194304,
// IndexedAccess = 8388608,

///// TODO
// Any = 1,
// Unknown = 2,
// Enum = 32,
// EnumLiteral = 1024,
// Void = 16384,
// Never = 131072,
// BigInt = 64,
// BigIntLiteral = 2048,

///// UNDECIDED
// ESSymbol = 4096,
// UniqueESSymbol = 8192,
// Conditional = 16777216,
// Substitution = 33554432,
// NonPrimitive = 67108864,
// TemplateLiteral = 134217728,
// StringMapping = 268435456,
// Literal = 2944,
// Unit = 109440,
// StringOrNumberLiteral = 384,
// PossiblyFalsy = 117724,
// StringLike = 402653316,
// NumberLike = 296,
// BigIntLike = 2112,
// BooleanLike = 528,
// EnumLike = 1056,
// ESSymbolLike = 12288,
// VoidLike = 49152,
// UnionOrIntersection = 3145728,
// StructuredType = 3670016,
// TypeVariable = 8650752,
// InstantiableNonPrimitive = 58982400,
// InstantiablePrimitive = 406847488,
// Instantiable = 465829888,
// StructuredOrInstantiable = 469499904,
// Narrowable = 536624127,

type Validator = (node: TSNode) => ts.Statement

const validators: Array<{
  flag: ts.TypeFlags
  validator: Validator
}> = [
  {
    flag: ts.TypeFlags.NumberLiteral,
    validator: generateNumberLiteralValidator,
  },
  {
    flag: ts.TypeFlags.StringLiteral,
    validator: generateStringLiteralValidator,
  },
  {
    flag: ts.TypeFlags.BooleanLiteral,
    validator: generateBooleanLiteralValidator,
  },
  { flag: ts.TypeFlags.Number, validator: generateNumberValidator },
  { flag: ts.TypeFlags.String, validator: generateStringValidator },
  { flag: ts.TypeFlags.Boolean, validator: generateBooleanValidator },
  { flag: ts.TypeFlags.Null, validator: generateNullValidator },
  { flag: ts.TypeFlags.Undefined, validator: generateUndefinedValidator },
  { flag: ts.TypeFlags.Object, validator: generateObjectValidator },
]

function generateTypeElementValidator(node: TSTypeElementNode): ts.Statement {
  const validator = findValidator(node)

  const validationStatement = validator(node)

  if (node.compilerNode.questionToken) {
    return factory.createIfStatement(
      factory.createBinaryExpression(
        node.refExpr,
        factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
        factory.createIdentifier("undefined"),
      ),
      validationStatement,
    )
  }

  return validationStatement
}

function findValidator(node: TSNode): Validator {
  const validator = validators.reduce((result, { flag, validator }) => {
    if (result) {
      return result
    }
    return (node.type.flags & flag) === flag ? validator : null
  }, null as Validator | null)

  if (!validator) {
    throw new Error(`No validator found for type with flag ${node.type.flags}`)
  }

  return validator
}

function generateNumberValidator(node: TSNode): ts.Statement {
  return factory.createIfStatement(
    factory.createBinaryExpression(
      factory.createTypeOfExpression(node.refExpr),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createStringLiteral("number"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not a number"),
    factory.createIfStatement(
      factory.createCallExpression(
        factory.createIdentifier("isNaN"),
        undefined,
        [node.refExpr],
      ),
      generatePushErrorExpressionStatement(node.errorPath, "invalid number"),
      undefined,
    ),
  )
}

function generateStringValidator(node: TSNode): ts.Statement {
  return factory.createIfStatement(
    factory.createBinaryExpression(
      factory.createTypeOfExpression(node.refExpr),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createStringLiteral("string"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not a string"),
    undefined,
  )
}

function generateBooleanValidator(node: TSNode): ts.Statement {
  return factory.createIfStatement(
    factory.createBinaryExpression(
      factory.createTypeOfExpression(node.refExpr),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createStringLiteral("boolean"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not a boolean"),
    undefined,
  )
}

function generateNullValidator(node: TSNode): ts.Statement {
  return factory.createIfStatement(
    factory.createBinaryExpression(
      factory.createTypeOfExpression(node.refExpr),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createNull(),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not null"),
    undefined,
  )
}

function generateUndefinedValidator(node: TSNode): ts.Statement {
  return factory.createIfStatement(
    factory.createBinaryExpression(
      factory.createTypeOfExpression(node.refExpr),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createIdentifier("undefined"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not undefined"),
    undefined,
  )
}

function generateNumberLiteralValidator(node: TSNode): ts.Statement {
  if (!node.type.isNumberLiteral()) {
    throw new Error("Is not a NumberLiteral")
  }

  return factory.createIfStatement(
    factory.createBinaryExpression(
      node.refExpr,
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createNumericLiteral(node.type.value),
    ),
    generatePushErrorExpressionStatement(
      node.errorPath,
      `not ${node.type.value}`,
    ),
    undefined,
  )
}

function generateStringLiteralValidator(node: TSNode): ts.Statement {
  if (!node.type.isStringLiteral()) {
    throw new Error("Is not a StringLiteral")
  }

  return factory.createIfStatement(
    factory.createBinaryExpression(
      node.refExpr,
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createStringLiteral(node.type.value),
    ),
    generatePushErrorExpressionStatement(
      node.errorPath,
      `not '${node.type.value}'`,
    ),
    undefined,
  )
}

function generateBooleanLiteralValidator(node: TSNode): ts.Statement {
  if (
    !node.typeNode ||
    !ts.isLiteralTypeNode(node.typeNode) ||
    (node.typeNode.literal.kind !== ts.SyntaxKind.TrueKeyword &&
      node.typeNode.literal.kind !== ts.SyntaxKind.FalseKeyword)
  ) {
    throw new Error("Is not a BooleanLiteral")
  }

  const isTrue = node.typeNode.literal.kind === ts.SyntaxKind.TrueKeyword

  return factory.createIfStatement(
    factory.createBinaryExpression(
      node.refExpr,
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      isTrue ? factory.createTrue() : factory.createFalse(),
    ),
    generatePushErrorExpressionStatement(
      node.errorPath,
      isTrue ? `not true` : `not false`,
    ),
    undefined,
  )
}

function generateObjectValidator(node: TSNode): ts.Statement {
  if (!node.typeNode) {
    throw new Error("Required typeNode")
  }

  if (ts.isArrayTypeNode(node.typeNode)) {
    // const elementType = node.typeChecker.getTypeFromTypeNode(
    //   node.typeNode.elementType,
    // )
    const arrayElementNode = new TSArrayElementNode(
      node.typeNode.elementType,
      node.typeChecker,
      node,
    )
    const elementTypeValidator = findValidator(arrayElementNode)
    return generateArrayValidator(node, arrayElementNode, elementTypeValidator)
  } else if (ts.isTypeLiteralNode(node.typeNode)) {
    return factory.createIfStatement(
      generateTypeofIsObjectAndIsNotNullExpression(node.refExpr),
      generatePushErrorExpressionStatement(
        node.errorPath,
        "null or not an object",
      ),
      factory.createBlock(
        node.typeNode.members.map((member) => {
          const subnode = new TSTypeElementNode(member, node.typeChecker, node)
          return generateTypeElementValidator(subnode)
        }),
      ),
    )
  } else {
    throw new Error(`${node.typeNode.kind} not an array`)
  }
}

function generateArrayValidator(
  arrayNode: TSNode,
  arrayElementNode: TSArrayElementNode,
  validator: Validator,
): ts.Statement {
  return factory.createIfStatement(
    generateTypeofIsObjectAndIsNotNullExpression(arrayNode.refExpr),
    generatePushErrorExpressionStatement(arrayNode.errorPath, "not an array"),
    factory.createForStatement(
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(arrayElementNode.name),
            undefined,
            undefined,
            factory.createNumericLiteral("0"),
          ),
        ],
        ts.NodeFlags.Let,
      ),
      factory.createBinaryExpression(
        factory.createIdentifier(arrayElementNode.name),
        factory.createToken(ts.SyntaxKind.LessThanToken),
        factory.createPropertyAccessExpression(
          arrayNode.refExpr,
          factory.createIdentifier("length"),
        ),
      ),
      factory.createPostfixUnaryExpression(
        factory.createIdentifier(arrayElementNode.name),
        ts.SyntaxKind.PlusPlusToken,
      ),
      validator(arrayElementNode),
    ),
  )
}

function generateTypeofIsObjectAndIsNotNullExpression(
  exprOfVar: ts.Expression,
) {
  return factory.createBinaryExpression(
    factory.createBinaryExpression(
      factory.createTypeOfExpression(exprOfVar),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createStringLiteral("object"),
    ),
    factory.createToken(ts.SyntaxKind.BarBarToken),
    factory.createBinaryExpression(
      exprOfVar,
      factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      factory.createNull(),
    ),
  )
}

function generatePushErrorExpressionStatement(
  errorPath: ts.Expression,
  message: string,
): ts.Statement {
  return factory.createBlock(
    [
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier("errors"),
            factory.createIdentifier("push"),
          ),
          undefined,
          [
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier("path"),
                  errorPath,
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier("message"),
                  factory.createNoSubstitutionTemplateLiteral(message),
                ),
              ],
              true,
            ),
          ],
        ),
      ),
    ],
    true,
  )
}
