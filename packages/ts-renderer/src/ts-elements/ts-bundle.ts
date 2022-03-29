import React from "react"
import ts from "typescript"
import {
  generateSourceFile,
  TSSourceFile,
  TSSourceFileElement,
} from "./ts-source-file"
import { mapChildren } from "./utils"

export interface TSBundle {
  children?: TSSourceFileElement | TSSourceFileElement[]
}

export type TSBundleElement = React.ReactElement<TSBundle, "ts-bundle">

export function generateBundle(element: TSBundleElement): ts.Bundle {
  const sourceFiles = mapChildren(element.props.children, generateSourceFile)
  return ts.factory.createBundle(sourceFiles)
}
