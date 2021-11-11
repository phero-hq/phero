import getArticle from "./getArticle"
import editArticle from "./editArticle"
import removeArticle from "./removeArticle"
import publishArticle from "./publishArticle"
import deployStaticWebsite from "./deployStaticWebsite"

interface Topic<TMessage> {
  publish(m: TMessage)
}

interface HttpReq {
  header: { authorization: string }
}
interface NextFunction {}

function requireAuthorRole(
  req: HttpReq,
  next: NextFunction<SamenContext, "idToken">,
) {
  // idToken = fb.verifyToken(req.header.authorization)
  // console.log("voordat we de samen functie aanroepen")
  // await next({ idToken })
  // console.log("nadat we de samen functie aanroepen")
}
interface IdToken {}
interface Context<T> {}
interface SamenContext {
  idToken: IdToken
}

function createTopic<TMessage>(...x: any): Topic<TMessage> {
  return x
}

function requireCmsUser(...x: any) {}
function requireAdminRole(...x: any) {}

// const createService =
//   () =>
//   (...x: any) => {}

interface ArticlePublishedMessage {}
const topicArticlePublished = createTopic<ArticlePublishedMessage>()

interface SamenServiceDefinition<T> {
  funcs: Record<string, SamenFunctionDefinition>
  config: SamenFunctionConfig
}

interface SamenFunctionDefinition {
  func: Function
  config: SamenFunctionConfig
}

interface SamenFunctionConfig {
  memory?: number
  timeout?: number
  minInstance?: number
  maxInstance?: number
  middlewares?: Function[]
}

function createService<T extends Record<string, SamenFunctionDefinition>>(
  serviceDefinition: T,
): SamenServiceDefinition<T> {
  return {} as any
}

function createFunction(
  funcDefinition: SamenFunctionDefinition,
  config: SamenFunctionConfig,
): SamenFunctionDefinition {
  return {} as any
}

export const cmsService = createService(
  {
    getArticle,

    editArticle: createFunction(editArticle, {
      middlewares: [requireAuthorRole],
    }),

    removeArticle: createFunction(removeArticle, {
      middlewares: [requireAdminRole],
    }),

    publishArticle: createFunction(publishArticle, {
      memory: 2048,
    }),

    deployStaticWebsite: createFunction(deployStaticWebsite, {
      trigger: [topicArticlePublished],
      schedule: "0 2 * * *",
      memory: 512,
    }),
  },
  {
    memory: 1024,
    minInstance: 1,
    maxInstance: 4,
    middlewares: [requireCmsUser],
  },
)

const samen = new SamenClient()

samen.addInterceptor((req) => {
  req.headers.lang = "en"
  req.headers.authorization = `Bearer ey${fb.getToken().substring(2)}`
})

// migration

migrate(
  cmsService.getArticle,
  2,
  (oldParam: string) => async (rpc: (newParam: number) => Promise<boolean>) => {
    return rpc(Number.parseInt(oldParam, 10))
  },
)

migrate(
  cmsService.getArticle,
  3,
  (oldParam: number) =>
    async (rpc: (newParam: number, aad: boolean) => Promise<boolean>) => {
      return rpc(oldParam, false)
    },
)

migrate(
  cmsService.getArticle,
  4,
  (oldParam: number, ctx: SamenContext) =>
    async (
      rpc: (
        newParam: number,
        aad: boolean,
        ctx: SamenContext,
      ) => Promise<boolean>,
    ) => {
      return rpc(oldParam, false, ctx)
    },
)

migrate(
  cmsService.getArticle,
  5,
)(
  (oldParam: number) =>
    async (rpc: (newParam: number, aad: boolean) => Promise<boolean>) => {
      return rpc(oldParam, false)
    },
)

migrateAPI(cmsService.getArticle)
  .toVersion(5)
  .map(
    (oldParam: number) =>
      async (rpc: (newParam: number, aad: boolean) => Promise<boolean>) => {
        return rpc(oldParam, false)
      },
  )
