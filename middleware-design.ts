import firebase from "firebase-admin"
function createFunction(...p: any): any {}
type NextFunction<T = void> = (ctx: T) => Promise<void>

type SamenContext<TIn> = TIn

async function requireAuthenticatedUser(
  next: NextFunction<{ userId: string }>,
  ctx: SamenContext<{ idToken: string }>,
): Promise<void> {
  const decodedToken = await firebase.getAuth().verifyIdToken(ctx.idToken)

  const { uid: userId } = decodedToken

  if (!userId) {
    throw new Error("Unauthorized")
  }

  await next({ userId })
}

enum Locale {
  nl_NL = "nl_NL",
  en_US = "en_US",
}

async function requireLocale(
  next: NextFunction<{ locale: Locale }>,
  ctx: SamenContext<{ locale?: Locale }>,
) {
  const locale = ctx.locale ?? Locale.nl_NL // default

  await next({ locale })
}

const db: any = {}
type Catalog = any
type User = any

async function loadCatalog(
  next: NextFunction<{ catalog: Catalog }>,
  ctx: SamenContext<{ locale: Locale }>,
) {
  const catalog: Catalog = await db.getCatalog(ctx.locale)
  await next({ catalog })

  const t1 = Date.now()
}

async function loadUser(
  next: NextFunction<{ user: User }>,
  ctx: SamenContext<{ userId: string }>,
) {
  const user: User = await db.getUser(ctx.userId)
  await next({ user })
}

async function logTimeStats(next: NextFunction) {
  const t0 = Date.now()

  await next()

  const t1 = Date.now()

  console.log(t0 - t1, "Samen RPC call took ")
}

async function myLousyRpcFunction(
  aap: string,
  noot: number,
  mies: boolean,
  ctx: SamenContext<{ locale: Locale; user: User; catalog: Catalog }>,
): Promise<{
  aap: string
  noot: number
  mies: boolean
  locale: Locale
  user: User
  catalog: Catalog
}> {
  return {
    aap,
    noot,
    mies,
    locale: ctx.locale,
    user: ctx.user,
    catalog: ctx.catalog,
  }
}

export default createFunction(myLousyRpcFunction, {
  middleware: [
    requireAuthenticatedUser,
    requireLocale,
    loadCatalog,
    loadUser,
    logTimeStats,
    myLousyRpcFunction,
  ],
})
