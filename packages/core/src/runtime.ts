export * as parser from "./generateParser/static"

export type {
  Parser,
  ParseResult,
  DataParseSuccess,
  DataParseFailure,
  DataParseError,
} from "./domain/Parser"

export type {
  RPCResult,
  RPCOkResult,
  RPCBadRequestResult,
  RPCInternalServerErrorResult,
} from "./domain/RPCResult"
