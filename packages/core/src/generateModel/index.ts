import { type ParserModel } from "../domain/ParserModel"

export {
  default as generateParserModelForError,
  type ErrorParserModel,
} from "./generateParserModelForError"
export {
  default as generateParserModelForFunction,
  type FunctionParserModel,
} from "./generateParserModelForFunction"
export {
  default as generateParserModelForMiddleware,
  type MiddlewareParserModel,
} from "./generateParserModelForMiddleware"
export {
  default as generateParserModelForServiceContext,
  type ServiceContextParserModel,
} from "./generateParserModelForServiceContext"

export interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

export interface InternalParserModelMap {
  root: ParserModel
  deps: DependencyMap
}

export type DependencyMap = Map<string, ParserModel>
export type TypeParamMap = Map<string, { name: string; model: ParserModel }>
