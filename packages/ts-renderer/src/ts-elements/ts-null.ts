import React from "react"
import ts from "typescript"

export interface TSNull {
  children?: undefined
}

export type TSNullElement = React.ReactElement<TSNull, "ts-null">

export function generateNull(): ts.NullLiteral {
  return ts.factory.createNull()
}
