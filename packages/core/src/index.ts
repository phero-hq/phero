export type {
  PheroApp,
  PheroError,
  PheroFunction,
  PheroService,
  PheroServiceConfig,
} from "./domain/PheroApp"
export {
  MissingTSConfigFileError,
  MissingPheroFileError,
  PheroParseError,
  PortInUseError,
  hasErrorCode,
} from "./domain/errors"
export type {
  RPCResult,
  RPCOkResult,
  RPCBadRequestResult,
  RPCInternalServerErrorResult,
} from "./domain/RPCResult"

export { parsePheroApp } from "./parsePheroApp"
export { default as parseManifest } from "./parseManifest/parseManifest"
export { default as generateManifest } from "./generateManifest/generateManifest"

export * as tsx from "./tsx"

export {
  generateFunctionParsers,
  generateModelParser,
  generateErrorParser,
  generateParserFunction,
  generateInlineParser,
  generateDependencyRefs,
  type DependencyRefs,
} from "./generateParser"

export { VirtualCompilerHost } from "./lib/VirtualCompilerHost"
export { default as cloneTS } from "./lib/cloneTS"

export * as parser from "./generateParser/static"
export type {
  Parser,
  ParseResult,
  DataParseSuccess,
  DataParseFailure,
  DataParseError,
} from "./domain/Parser"
