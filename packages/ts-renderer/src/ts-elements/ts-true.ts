import React from "react"
import ts from "typescript"

export interface TSTrue {
  children?: undefined
}

export type TSTrueElement = React.ReactElement<TSTrue, "ts-true">

export function generateTrue(): ts.TrueLiteral {
  return ts.factory.createTrue()
}
