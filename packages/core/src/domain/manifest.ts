import { JSValue } from "./JSValue"

export interface SamenManifest {
  rpcFunctions: RPCFunction[]
  models: ModelMap
  refs: RefMap
}

export interface RPCFunction {
  name: string
  parameters: RPCFunctionParameter[]
  returnType: JSValue
  modelIds: string[]
  namespace: string[]
}

export interface RPCFunctionParameter {
  name: string
  index: number
  value: JSValue
}

export type ModelMap = {
  [modelId: string]: Model
}

export interface Model {
  id: string
  name: string
  namespace: string[]
  ts: string
}

export type RefMap = {
  [refId: string]: Ref
}

export interface Ref {
  id: string
  modelId: string
  value: JSValue
}
