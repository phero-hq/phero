import ts, { TypeElement } from "typescript"
import { Model } from "../../parseSamenApp"

export abstract class TSNode {
  constructor(
    public readonly compilerNode: ts.Node,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent?: TSNode,
  ) {}

  private _dataVarExpr?: ts.Identifier
  public get dataVarExpr(): ts.Identifier {
    if (!this._dataVarExpr) {
      // if (this.parent instanceof TSModelNode) {
      //   this._dataVarExpr = this.parent.dataVarExpr
      // } else
      if (this instanceof TSModelNode) {
        this._dataVarExpr = ts.factory.createIdentifier(this.name)
      } else if (this instanceof TSObjectNode) {
        this._dataVarExpr = ts.factory.createIdentifier(
          `${this.parent.dataVarExpr.text}["${this.name}"]`,
        )
      } else if (this instanceof TSArrayElementNode) {
        this._dataVarExpr = ts.factory.createIdentifier(
          `${this.parent.dataVarExpr.text}[${this.name}]`,
        )
      } else if (this instanceof TSTupleElementNode) {
        this._dataVarExpr = ts.factory.createIdentifier(
          `${this.parent.dataVarExpr.text}[${this.position}]`,
        )
      } else if (this instanceof TSUnionElementNode) {
        this._dataVarExpr = this.parent.dataVarExpr
      } else if (this instanceof TSTypeElementNode) {
        this._dataVarExpr = ts.factory.createIdentifier(
          `${this.parent.dataVarExpr.text}["${this.name}"]`,
        )
      } else {
        throw new Error("Node type not yet implemented")
      }
    }
    return this._dataVarExpr
  }

  private _resultVarExpr?: ts.Identifier
  public get resultVarExpr(): ts.Identifier {
    if (!this._resultVarExpr) {
      this._resultVarExpr = ts.factory.createIdentifier(
        this.dataVarExpr.text.replace(/^[^\.\[]+/, "result"),
      )
    }
    return this._resultVarExpr
  }

  private _errorPath?: ts.Expression
  public get errorPath(): ts.Expression {
    if (!this._errorPath) {
      const [head, ...tail] = this.dataVarExpr.text
        // replace ["propName"] with .propName
        .replace(/\["(.+?)"\]+/g, ".$1")
        // split on array indexers
        .split(/\[it_\d+\]/)

      this._errorPath = tail.length
        ? ts.factory.createTemplateExpression(
            ts.factory.createTemplateHead(`${head}[`),
            tail.map((span, i) =>
              ts.factory.createTemplateSpan(
                ts.factory.createIdentifier(`it_${i}`),
                i === tail.length - 1
                  ? ts.factory.createTemplateTail(`]${span}`)
                  : ts.factory.createTemplateMiddle(`]${span}[`),
              ),
            ),
          )
        : ts.factory.createStringLiteral(head)
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
      } else {
        this._type = this.typeChecker.getTypeAtLocation(this.compilerNode)
      }
    }
    return this._type
  }

  private _typeNode?: ts.TypeNode
  public get typeNode(): ts.TypeNode {
    if (!this._typeNode) {
      if (ts.isTypeNode(this.compilerNode)) {
        this._typeNode = this.compilerNode
      } else if (
        ts.isPropertySignature(this.compilerNode) &&
        this.compilerNode.type
      ) {
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
    if (this._typeNode === undefined) {
      throw new Error("Node has no typeNode")
    }

    return this._typeNode
  }
}

export class TSModelNode extends TSNode {
  constructor(
    public readonly compilerNode: Model,
    public readonly typeChecker: ts.TypeChecker,
    public readonly name: string,
  ) {
    super(compilerNode, typeChecker)
  }
}

export class TSObjectNode extends TSNode {
  constructor(
    public readonly compilerNode: ts.TypeLiteralNode | ts.InterfaceDeclaration,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent: TSNode,
    public readonly name: string,
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

export class TSTupleElementNode extends TSNode {
  constructor(
    public readonly compilerNode: ts.TypeNode,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent: TSNode,
    public readonly position: number,
  ) {
    super(compilerNode, typeChecker, parent)
  }
}

export class TSUnionElementNode extends TSNode {
  constructor(
    public readonly compilerNode: ts.TypeNode,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent: TSNode,
  ) {
    super(compilerNode, typeChecker, parent)
  }
}

export class TSTypeElementNode extends TSNode {
  constructor(
    public readonly compilerNode: ts.TypeElement,
    public readonly typeChecker: ts.TypeChecker,
    public readonly parent: TSNode,
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
