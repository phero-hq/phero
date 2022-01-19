export type ParseResult<T> = ParseResultSuccess<T> | ParseResultFailure

export interface ParseResultSuccess<T> {
  ok: true
  result: T
}

export interface ParseResultFailure {
  ok: false
  errors: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
}
