import { type DataParseError } from "./Parser"

export type RPCResult<T> =
  | RPCOkResult<T>
  | RPCNoContentResult
  | RPCBadRequestResult
  | RPCInternalServerErrorResult

export interface RPCOkResult<T> {
  status: 200
  result: T
}

export interface RPCNoContentResult {
  status: 204
}

export interface RPCBadRequestResult {
  status: 400
  errors: DataParseError[]
  input: any
}

export interface RPCInternalServerErrorResult {
  status: 500
  error: {
    name: string
    props: Record<string, any>
    stack?: string
  }
}
