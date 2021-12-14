import ts, { TypeElement } from "typescript"
import { Model } from "../../parseSamenApp"

export abstract class TSNode {
  constructor(
    public readonly compilerNode: ts.Node,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent?: TSNode,
  ) {}

  public abstract get name(): string

  private _dataVarExpr?: ts.Identifier
  public get dataVarExpr(): ts.Identifier {
    if (!this._dataVarExpr) {
      this._dataVarExpr = this.parent
        ? ts.factory.createIdentifier(
            `${this.parent.dataVarExpr.text}[${
              this instanceof TSArrayElementNode ? this.name : `"${this.name}"`
            }]`,
          )
        : ts.factory.createIdentifier(this.name)
    }
    return this._dataVarExpr
  }

  private _resultVarExpr?: ts.Identifier
  public get resultVarExpr(): ts.Identifier {
    if (!this._resultVarExpr) {
      this._resultVarExpr = ts.factory.createIdentifier(
        this.dataVarExpr.text.replace(/^data/, "result"),
      )
    }
    return this._resultVarExpr
  }

  private _errorPath?: ts.TemplateExpression | ts.StringLiteral
  public get errorPath(): ts.TemplateExpression | ts.StringLiteral {
    if (!this._errorPath) {
      const parentErrorPath = this.parent?.errorPath

      if (!parentErrorPath) {
        this._errorPath = ts.factory.createStringLiteral(this.name)
      } else if (ts.isStringLiteral(parentErrorPath)) {
        if (this instanceof TSTypeElementNode) {
          this._errorPath = ts.factory.createStringLiteral(
            `${parentErrorPath.text}.${this.name}`,
          )
        } else {
          this._errorPath = ts.factory.createTemplateExpression(
            ts.factory.createTemplateHead(`${parentErrorPath.text}[`),
            [
              ts.factory.createTemplateSpan(
                ts.factory.createIdentifier(this.name),
                ts.factory.createTemplateTail(`]`),
              ),
            ],
          )
        }
      } else {
        const lastIndex = parentErrorPath.templateSpans.length - 1
        const previousSpans = parentErrorPath.templateSpans.slice(0, lastIndex)
        const lastSpan = parentErrorPath.templateSpans[lastIndex]
        if (this instanceof TSTypeElementNode) {
          this._errorPath = ts.factory.createTemplateExpression(
            parentErrorPath.head,
            [
              ...previousSpans,
              ts.factory.createTemplateSpan(
                lastSpan.expression,
                ts.factory.createTemplateTail(
                  `${lastSpan.literal.text}.${this.name}`,
                ),
              ),
            ],
          )
        } else {
          this._errorPath = ts.factory.createTemplateExpression(
            parentErrorPath.head,
            [
              ...previousSpans,
              ts.factory.createTemplateSpan(
                lastSpan.expression,
                ts.factory.createTemplateMiddle(`${lastSpan.literal.text}[`),
              ),
              ts.factory.createTemplateSpan(
                ts.factory.createIdentifier(this.name),
                ts.factory.createTemplateTail(`]`),
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
      if (ts.isTypeAliasDeclaration(this.compilerNode)) {
        this._type = this.typeChecker.getTypeFromTypeNode(
          this.compilerNode.type,
        )
      } else if (
        ts.isPropertySignature(this.compilerNode) &&
        this.compilerNode.type
      ) {
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
      } else if (ts.isTypeAliasDeclaration(this.compilerNode)) {
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

export class TSModelNode extends TSNode {
  constructor(
    public readonly compilerNode: Model,
    public readonly typeChecker: ts.TypeChecker,
  ) {
    super(compilerNode, typeChecker)
  }

  public get name(): string {
    return "data"
  }
}

export class TSObjectNode extends TSNode {
  constructor(
    public readonly compilerNode: ts.TypeLiteralNode | ts.InterfaceDeclaration,
    public readonly typeChecker: ts.TypeChecker,
    public readonly name: string,
    public readonly parent?: TSNode,
  ) {
    super(compilerNode, typeChecker, parent)
  }

  public get members(): TypeElement[] {
    return this.compilerNode.members.map((m) => m)
  }
}

export class TSArrayElementNode extends TSNode {
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

export class TSTypeElementNode extends TSNode {
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
