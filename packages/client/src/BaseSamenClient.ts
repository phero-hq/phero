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
) => {
  ok: boolean
  status: number
  json(): unknown
}

export type RequestInterceptor = (
  request: SamenRequest,
) => SamenRequest | Promise<SamenRequest>

export class NetworkError extends Error {}
export class HttpError extends Error {
  constructor(public readonly httpStatus: number) {
    super()
  }
}

export class BaseSamenClient {
  private interceptors: RequestInterceptor[] = []

  constructor(private readonly _fetch: Fetch, private readonly url: string) {}

  public addRequestInterceptor(interceptor: RequestInterceptor): this {
    this.interceptors.push(interceptor)
    return this
  }

  private async runRequestInterceptors(
    request: SamenRequest,
  ): Promise<SamenRequest> {
    let _result = request
    for (const interceptor of this.interceptors) {
      _result = await interceptor(_result)
    }
    return _result
  }

  protected async request<T>(name: string, body: object): Promise<T> {
    let result

    try {
      result = await this._fetch(
        this.url + name,
        await this.runRequestInterceptors({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
      )
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

  protected async requestVoid(name: string, body: object): Promise<void> {
    let result

    try {
      result = await this._fetch(
        this.url + name,
        await this.runRequestInterceptors({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
      )
    } catch (err) {
      console.error(err)
      throw new NetworkError()
    }

    if (!result.ok) {
      throw new HttpError(result.status)
    }
  }
}
