import ts from "typescript"

export interface PheroApp {
  models: PheroModel[]
  errors: PheroError[]
  services: PheroService[]
}

export interface PheroModel {
  name: string
  ref: Model
}

export type Model =
  | ts.InterfaceDeclaration
  | ts.TypeAliasDeclaration
  | ts.EnumDeclaration

export interface PheroError {
  name: string
  sourceFile: string
  properties: PheroErrorProperty[]
  ref: ts.ClassDeclaration
}

export interface PheroErrorProperty {
  name: string
  type: ts.TypeNode
}

export interface PheroService {
  name: string
  funcs: PheroFunction[]
  config: PheroServiceConfig
  ref: ts.Node
}

export interface PheroFunction {
  name: string
  returnType: ts.TypeNode

  parameters: PheroFunctionParameter[]
  contextParameterType?: ts.TypeNode

  ref: ts.FunctionLikeDeclarationBase
}

export interface PheroFunctionParameter {
  name: string
  questionToken: boolean
  type: ts.TypeNode
}

export interface PheroServiceConfig {
  // these are models which are not used inside functions, but we need them to generate parsers on the server side
  models?: PheroModel[]
  middleware?: PheroMiddlewareConfig[]
  contextType?: ts.TypeNode
}

export interface PheroMiddlewareConfig {
  paramsType: ts.TypeNode
  nextType: ts.TypeNode | undefined
  contextType: ts.TypeNode
  middleware: ts.FunctionLikeDeclarationBase
}
