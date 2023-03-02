export type Parser<T> = (data: unknown) => ParseResult<T>

export type ParseResult<T> = DataParseSuccess<T> | DataParseFailure

export interface DataParseSuccess<T> {
  ok: true
  result: T
}

export interface DataParseFailure {
  ok: false
  errors: DataParseError[]
}

export interface DataParseError {
  message: string
  path?: string
  errors?: DataParseError[]
}
