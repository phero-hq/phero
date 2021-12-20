import ts from "typescript"

export type PathSegment =
  | { type: "root"; name: string }
  | { type: "property"; name: string }
  | { type: "array-element" }
  | { type: "tuple-element"; position: number }

export class Pointer {
  private constructor(
    public readonly node: NodePointer,
    public readonly path: PathSegment[],
  ) {}

  public static create(node: NodePointer, name: string) {
    return new Pointer(node, [{ type: "root", name }])
  }

  public withProperty(node: ts.Node, name: string) {
    return new Pointer(new NodePointer(node, this.node.typeChecker), [
      ...this.path,
      { type: "property", name },
    ])
  }

  public withArrayElement(node: ts.Node) {
    return new Pointer(new NodePointer(node, this.node.typeChecker), [
      ...this.path,
      { type: "array-element" },
    ])
  }

  public withTupleElement(node: ts.Node, position: number) {
    return new Pointer(new NodePointer(node, this.node.typeChecker), [
      ...this.path,
      { type: "tuple-element", position },
    ])
  }

  public get kind(): ts.SyntaxKind {
    if (
      this.path[this.path.length - 1].type === "property" &&
      ts.isPropertySignature(this.node.node)
    ) {
      if (!this.node.node.type) {
        throw new Error("prop should have type")
      }

      return this.node.node.type.kind
    }

    return this.node.node.kind
  }

  public get dataVarExpr(): ts.Identifier {
    const arrayElements = this.path.filter((el) => el.type === "array-element")

    return ts.factory.createIdentifier(
      this.path
        .map((element) => {
          switch (element.type) {
            case "root":
              return element.name
            case "property":
              return `["${element.name}"]`
            case "array-element":
              return `[it_${arrayElements.indexOf(element)}]`
            case "tuple-element":
              return `[${element.position}]`
          }
        })
        .join(""),
    )
  }

  public get resultVarExpr(): ts.Identifier {
    return ts.factory.createIdentifier(
      this.dataVarExpr.text.replace(/^[^\.\[]+/, "result"),
    )
  }

  public get errorPath(): ts.Expression {
    const [head, ...tail] = this.dataVarExpr.text
      // replace ["propName"] with .propName
      .replace(/\["(.+?)"\]+/g, ".$1")
      // split on array indexers
      .split(/\[it_\d+\]/)

    return tail.length
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
}

export class NodePointer {
  constructor(
    public readonly node: ts.Node,
    public readonly typeChecker: ts.TypeChecker,
  ) {}
}
