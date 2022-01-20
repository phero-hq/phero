import { ValidationError } from "./code-gen/ParseResult"

export type RPCResult<T> =
  | RPCOkResult<T>
  | RPCBadRequestResult
  | RPCInternalServerErrorResult

export interface RPCOkResult<T> {
  status: 200
  result: T
}

export interface RPCBadRequestResult {
  status: 400
  errors: ValidationError[]
}

export interface RPCInternalServerErrorResult {
  status: 500
  error: Error
}
