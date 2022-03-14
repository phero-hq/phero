export interface SamenRequest {
  method: "GET" | "POST"
  headers: {
    [header: string]: string
  }
  body: string
}

export type Fetch = (
  url: string,
  request: SamenRequest,
) => Promise<{
  ok: boolean
  status: number
  json(): Promise<unknown>
}>

export class NetworkError extends Error {}
export class HttpError extends Error {
  constructor(public readonly httpStatus: number) {
    super()
  }
}

export class BaseSamenClient {
  // TODO: Strip out trailing slash from url:
  constructor(private readonly _fetch: Fetch, private readonly url: string) {}

  protected async request<T>(
    serviceName: string,
    functionName: string,
    body: object,
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
      throw new HttpError(result.status)
    }

    const data = await result.json()
    return data as T
  }

  protected async requestVoid(
    serviceName: string,
    functionName: string,
    body: object,
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
      throw new HttpError(result.status)
    }
  }
}
