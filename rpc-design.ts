async function rpc(input: any): Promise<RPCResult<Article>> {
  const inputParseResult = inputParser(input)

  if (inputParseResult.ok == false) {
    // weird, somehow I need
    return { status: 400, errors: inputParseResult.errors }
  }

  try {
    const output = await myFunction(...inputParseResult.result)
    const outputParseResult = outputParser(output)

    if (outputParseResult.ok == false) {
      return {
        status: 400,
        errors: outputParseResult.errors,
      }
    }

    return { status: 200, result: outputParseResult.result }
  } catch (error) {
    return { status: 500, error }
  }

  function inputParser(data: any): ParseResult<[string, string]> {
    const errors: ValidationError[] = []
    let result: any
    if (typeof data !== "object" || data === null) {
      errors.push({
        path: "data",
        message: `null or not an object`,
      })
    } else {
      result = {}
      if (typeof data["id"] !== "string") {
        errors.push({
          path: "data.id",
          message: `not a string`,
        })
      } else result["id"] = data["id"]
      if (typeof data["text"] !== "string") {
        errors.push({
          path: "data.text",
          message: `not a string`,
        })
      } else result["text"] = data["text"]
    }
    if (errors.length) {
      return { ok: false, errors }
    }
    return { ok: true, result: result as [string, string] }
  }

  function outputParser(data: any): ParseResult<Article> {
    const errors: ValidationError[] = []
    let result: any

    // parses Article

    if (errors.length) {
      return { ok: false, errors }
    }

    return { ok: true, result: result as Article }
  }
}

interface Article {
  id: string
  text: string
}

async function myFunction(id: string, text: string): Promise<Article> {
  return {
    id,
    text,
  }
}

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
