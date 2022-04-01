import React from "react"
import { TSElements } from "."

export interface TSRoot {
  children: TSElements
}

export type TSRootElement = React.ReactElement<TSRoot, "ts-root">
