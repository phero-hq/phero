import type { ParseResult, DataParseError } from "@phero/core"

export interface PheroRequest {
  method: "GET" | "POST"
  headers: {
    [header: string]: string
  }
  body: string
}

export type Fetch = (
  url: string,
  request: PheroRequest,
) => Promise<{
  ok: boolean
  status: number
  json(): Promise<unknown>
}>

export class NetworkError extends Error {}

export class ParseError extends Error {
  constructor(public readonly errors: DataParseError[]) {
    super()
  }
}

export class BasePheroClient {
  // TODO: Strip out trailing slash from url:
  constructor(private readonly _fetch: Fetch, private readonly url: string) {}

  protected async request<T>(
    serviceName: string,
    functionName: string,
    body: object,
    errorParser: (error: any) => Error,
    resultParser: (data: any) => ParseResult<T>,
  ): Promise<T> {
    let result

    try {
      result = await this._fetch(`${this.url}/${serviceName}/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error(err)
      throw new NetworkError()
    }

    if (!result.ok) {
      await handleErrorResult(serviceName, functionName, errorParser, result)
    }

    let data = undefined
    if (result.status !== 204) {
      data = await result.json()
    }

    const parseResult = resultParser(data)

    if (parseResult.ok == false) {
      throw new ParseError(parseResult.errors)
    }

    return parseResult.result
  }

  protected async requestVoid(
    serviceName: string,
    functionName: string,
    body: object,
    errorParser: (error: any) => Error,
  ): Promise<void> {
    let result

    try {
      result = await this._fetch(`${this.url}/${serviceName}/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error(err)
      throw new NetworkError()
    }

    if (!result.ok) {
      await handleErrorResult(serviceName, functionName, errorParser, result)
    }
  }
}

async function handleErrorResult(
  serviceName: string,
  functionName: string,
  errorParser: (error: any) => Error,
  result: Awaited<ReturnType<Fetch>>,
): Promise<never> {
  if (result.status === 400) {
    throw new Error(
      `RPC ${serviceName}.${functionName} was called with incorrect parameters.`,
    )
  } else {
    const data = await result.json()

    const isValidError =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "object" &&
      data.error !== null

    if (!isValidError) {
      throw new Error(
        `Error response of RPC ${serviceName}.${functionName} is invalid.`,
      )
    }

    throw errorParser(data.error)
  }
}
