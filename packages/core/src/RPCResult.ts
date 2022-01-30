import { ValidationError } from "./code-gen/ParseResult"

export type RPCResult<T> =
  | RPCOkResult<T>
  // | RPCNoContentResult
  | RPCBadRequestResult
  // | RPCUnauthorizedResult
  | RPCInternalServerErrorResult

export interface RPCOkResult<T> {
  status: 200
  result: T
}

// export interface RPCNoContentResult {
//   status: 204
// }

export interface RPCBadRequestResult {
  status: 400
  errors: ValidationError[]
}

// export interface RPCUnauthorizedResult {
//   status: 401
// }

export interface RPCInternalServerErrorResult {
  status: 500
  error: Error
}
