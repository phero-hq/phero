export type Parser<T> = (data: unknown) => ParseResult<T>

export type ParseResult<T> = ParseSucceed<T> | ParseFailure

export interface ParseSucceed<T> {
  ok: true
  result: T
}

export interface ParseFailure {
  ok: false
  errors: ParseError[]
}

export interface ParseError {
  message: string
  path?: string
  errors?: ParseError[]
}
