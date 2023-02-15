import { ParseError } from "./Parser"

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
  errors: ParseError[]
  input: any
}

// export interface RPCUnauthorizedResult {
//   status: 401
// }

export interface RPCInternalServerErrorResult {
  status: 500
  error: {
    name: string
    props: Record<string, any>
    stack: string
  }
}
