import React from "react"
import ts from "typescript"

export interface TSFalse {
  children?: undefined
}

export type TSFalseElement = React.ReactElement<TSFalse, "ts-false">

export function generateFalse(): ts.FalseLiteral {
  return ts.factory.createFalse()
}
