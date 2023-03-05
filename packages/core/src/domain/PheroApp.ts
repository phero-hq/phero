import type ts from "typescript"
import { type ObjectParserModel, type ParserModel } from "./ParserModel"

export interface PheroApp {
  models: PheroModel[]
  errors: PheroError[]
  services: PheroService[]
  deps: Map<string, ParserModel>
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
  errorModel: ObjectParserModel
  ref: ts.ClassDeclaration
}

export interface PheroErrorProperty {
  name: string
  optional: boolean
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
  returnTypeModel: ParserModel

  parameters: PheroFunctionParameter[]
  parametersModel: ObjectParserModel

  contextType?: ts.TypeNode
  contextTypeModel?: ObjectParserModel

  ref: ts.FunctionLikeDeclarationBase
}

export interface PheroFunctionParameter {
  name: string
  questionToken: boolean
  type: ts.TypeNode
}

export interface PheroServiceConfig {
  middleware: PheroMiddlewareConfig[]
  contextType?: ts.TypeLiteralNode
  contextTypeModel?: ObjectParserModel
}

export interface PheroMiddlewareConfig {
  middleware: ts.FunctionLikeDeclarationBase
  contextType?: ts.TypeNode
  contextTypeModel: ObjectParserModel
  nextType?: ts.TypeNode
  nextTypeModel: ObjectParserModel
}
