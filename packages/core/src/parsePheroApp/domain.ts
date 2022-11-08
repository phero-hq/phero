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
  parameters: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  serviceContext?: {
    type: ts.TypeNode
    paramName?: string
  }
  ref: ts.FunctionLikeDeclarationBase
}

export interface PheroServiceConfig {
  middleware?: PheroMiddlewareConfig[]
  contextType?: ts.TypeNode
}

export interface PheroMiddlewareConfig {
  paramsType: ts.TypeNode
  nextType: ts.TypeNode | undefined
  contextType: ts.TypeNode
  middleware: ts.FunctionLikeDeclarationBase
}
