import { tsx } from "@phero/core"
import ts from "typescript"

export function write404ResponseStatement(): ts.Statement {
  return writeResponseStatement(
    tsx.literal.object(
      tsx.property.assignment("status", tsx.literal.number(404)),
      tsx.property.assignment("error", tsx.literal.string("RPC Not Found")),
    ),
  )
}

export function writeResponseStatement(
  expression: ts.Expression,
): ts.Statement {
  return tsx.statement.expression(
    tsx.expression.call("writeResponse", {
      args: ["originWhitelist", expression, "res", "req"],
    }),
  )
}

export function generateCreateAndStartServer(): ts.Node {
  return tsx.verbatim(`const PORT = process.env.PORT ?? 2222
  createServer(requestListener)
    .listen(PORT)
    .on("listening", () =>
      console.info(\`Phero started listening on port \${PORT}\`),
    )
`)
}
