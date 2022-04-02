import ts from "typescript"
import { block } from "./block"
import { constDeclaration } from "./const"

export class Statement {
  public static if(props: {
    expression: ts.Expression
    then: ts.Statement
    else?: ts.Statement
  }): ts.IfStatement {
    return ts.factory.createIfStatement(
      props.expression,
      props.then,
      props.else,
    )
  }

  public static try(props: {
    block: ts.Block | ts.Statement[]
    catch: {
      error: string
      block?: ts.Block | ts.Statement[]
    }
    finally?: ts.Block | ts.Statement[]
  }): ts.TryStatement {
    return ts.factory.createTryStatement(
      Array.isArray(props.block)
        ? ts.factory.createBlock(props.block)
        : props.block,
      ts.factory.createCatchClause(
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(props.catch.error),
          undefined,
          undefined,
          undefined,
        ),
        props.catch.block
          ? Array.isArray(props.catch.block)
            ? ts.factory.createBlock(props.catch.block)
            : props.catch.block
          : ts.factory.createBlock([]),
      ),
      Array.isArray(props.finally)
        ? ts.factory.createBlock(props.finally)
        : props.finally,
    )
  }

  public static block = block

  public static const = constDeclaration

  public static return(expression?: ts.Expression): ts.ReturnStatement {
    return ts.factory.createReturnStatement(expression)
  }
}
