import { ParserModel } from "../domain/ParserModel"

export {
  default as generateParserModelForError,
  ErrorParserModel,
} from "./generateParserModelForError"
export {
  default as generateParserModelForFunction,
  FunctionParserModel,
} from "./generateParserModelForFunction"
export {
  default as generateParserModelForMiddleware,
  MiddlewareParserModel,
} from "./generateParserModelForMiddleware"
export {
  default as generateParserModelForServiceContext,
  ServiceContextParserModel,
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
