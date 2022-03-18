type Ctx = { x: string }

type Middleware<TIn, TOut> = (
  next: (p: TOut) => Promise<void>,
  context: TIn,
) => Promise<void>

async function middleware0(
  next: (ctx: Ctx) => Promise<void>,
  context: Ctx,
): Promise<void> {
  console.log("Middleware", "start", 0, context.x)
  await sleep(5)
  await next({ x: context.x + "~" + "m1", a: 1 } as Ctx)
  await sleep(1)
  console.log("Middleware", "end", 0)
}

async function middleware1(
  next: (ctx: Ctx) => Promise<void>,
  context: Ctx,
): Promise<void> {
  console.log("Middleware", "start", 1, context.x)
  await sleep(2)
  await next({ x: context.x + "~" + "m2", b: 2 } as Ctx)
  await sleep(2)
  console.log("Middleware", "end", 1)
}

async function middleware2(
  next: (ctx: Ctx) => Promise<void>,
  context: Ctx,
): Promise<void> {
  console.log("Middleware", "start", 2, context.x)
  await sleep(1)
  await next({ x: context.x + "~" + "m3", c: 3 } as Ctx)
  await sleep(5)
  console.log("Middleware", "end", 2)
}

async function actualFunction(context: Ctx): Promise<void> {
  console.log("ActualFunction", "running", context.x)
}

type Resolvers = {
  inputContext: Defer<Ctx>
  exec: Defer<void>
}
async function runWithMiddlewares<T>(
  middlewares: Middleware<Ctx, Ctx>[],
  context: any,
  func: (ctx: Ctx) => Promise<T>,
): Promise<T> {
  const actualFunctionResolver: Resolvers = {
    inputContext: defer<Ctx>(),
    exec: defer<void>(),
  }
  const resolvers = [
    ...middlewares.map(() => ({
      inputContext: defer<Ctx>(),
      exec: defer<void>(),
    })),
    actualFunctionResolver,
  ]

  resolvers[0].inputContext.resolve(context)

  for (let i = 0; i < middlewares.length; i++) {
    const middleware = middlewares[i]
    const currResolverIndex = i
    const nextResolverIndex = i + 1

    const ctx = await resolvers[currResolverIndex].inputContext.promise
    const parsedContext = parseMiddlewareContext(i, ctx)

    middleware(async (nextOutput: Ctx) => {
      const parsedOut = parseMiddlewareNextOut(i, nextOutput)

      resolvers[nextResolverIndex].inputContext.resolve({
        // this way we don't lose any accumulated context
        ...ctx,
        ...parsedOut,
      })

      await resolvers[nextResolverIndex].exec.promise
    }, parsedContext).then(() => {
      resolvers[currResolverIndex].exec.resolve()
    })
  }

  const middlewareOutput: Ctx = await actualFunctionResolver.inputContext
    .promise

  // parse middlewareOutput into function context

  const result = await func(middlewareOutput)
  actualFunctionResolver.exec.resolve()
  await resolvers[0].exec.promise

  return result
}

function parseMiddlewareContext(i: number, x: any): Ctx {
  console.log("Parser Context", i, x)
  return x as Ctx
}

function parseMiddlewareNextOut(i: number, x: any): Ctx {
  console.log("Parsing Next", i, x)
  return x as Ctx
}

;(async function () {
  const middlewares: Middleware<Ctx, Ctx>[] = [
    middleware0,
    middleware1,
    middleware2,
  ]
  try {
    await runWithMiddlewares(middlewares, { x: "epoch" }, actualFunction)
    console.log("all done")
  } catch (e) {
    console.error(e)
  }
})()

async function sleep(s: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

type Defer<T = void> = {
  resolve: (result: T) => void
  reject: (err: Error) => void
  promise: Promise<T>
}

function defer<T>(): Defer<T> {
  const deferred: Defer<T> = {} as Defer<T>
  const promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = (result: T) => resolve(result)
    deferred.reject = (err: Error) => reject(err)
  })
  deferred.promise = promise
  return deferred
}
