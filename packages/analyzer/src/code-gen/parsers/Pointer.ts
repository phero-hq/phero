import ts from "typescript"
import { ParserModel, ParserModelType } from "./generateParserModel"

export default class Pointer<TParserModel extends ParserModel> {
  public readonly path: ParserModel[] = []

  constructor(
    public readonly model: TParserModel,
    private readonly ancestors: ParserModel[],
  ) {
    this.path = [...ancestors, model]
  }

  public get dataVarExpr(): ts.Identifier {
    return this.generateVarExpr(this.path)
  }

  public get parentVarExpr(): ts.Identifier {
    return this.generateVarExpr(this.ancestors)
  }

  public generateVarExpr(path: ParserModel[]): ts.Identifier {
    return ts.factory.createIdentifier(
      path
        .map((element) => {
          switch (element.type) {
            case ParserModelType.Root:
              return element.name
            case ParserModelType.Member:
              return `["${element.name}"]`
            case ParserModelType.IndexMember:
              return `[it_${element.depth}]`
            case ParserModelType.ArrayElement:
              return `[it_${element.depth}]`
            case ParserModelType.TupleElement:
              return `[${element.position}]`
            default:
              return ""
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
