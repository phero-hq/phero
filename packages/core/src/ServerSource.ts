import ts from "typescript"
import { Model } from "./parseSamenApp"

export interface ServerSource {
  domainModels: Model[]
  services: Array<{
    name: string
    models: Model[]
    functions: ts.FunctionLikeDeclarationBase[]
  }>
}
