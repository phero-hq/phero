---
sidebar_position: 4
---

There are cases where all functions in a service need a certain piece of data or logic. You can use context and middleware together, to prevent duplicate code.

**Context:** A typed object, shared across the functions of a service. It can be created from the client and server. From that point, middleware can modify this object before it ends up at a function of the service.

**Middleware:** A function that modifies the context. Recieves the previous context and the parameters of the functions of the service. Also recieves a `next` function, which should always be called to continue to the next middleware. It looks like this:

```ts
function exampleMiddleware(
  params: PheroParams, // the params of the function of the service
  context: PheroContext, // the context, built up until this point
  next: NextFunction, // to be called to go to continue
) {
  await next()
}
```

:::info
Middleware in Phero is heavily inspired by [middleware in .NET](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-6.0). For example, the way [a pipeline of middleware is called](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-6.0#create-a-middleware-pipeline-with-webapplication) works identical in Phero.
:::

Let's dive into a couple examples to explain how this works.

## Authorization

For this example, we'll assume that the client has authentication already implemented. Now it's up to the server to make sure certain functions can't be accessed if the user is not logged in. The client has obtained a `idToken`, which should be validated by the server in order to get the user's data. Without context and middleware, it would look something like this:

```ts
import { createService } from "@phero/server"
import db, { Article, User } from "./fake-db"

function requireUser(idToken: string) {
  const user = verifyIdToken(ctx.idToken)
  if (!user) {
    throw new Error("Authentication error")
  }
}

async function createArticle(article: Article, idToken: string): Promise<void> {
  requireUser(idToken)
  return db.articles.create(article)
}

async function deleteArticle(id: string, idToken: string): Promise<void> {
  requireUser(idToken)
  return db.articles.deleteById(id)
}

export const articleService = createService({
  createArticle,
  deleteArticle,
})
```

Where the client would pass the `idToken` for each function:

```ts
await client.articleService.deleteArticle("123", idToken)
```

This works, but it could get messy and you should be extra careful not to forget to add the `requireUser` for every function. With context and middleware, it becomes something like this:

```ts
import { createService, PheroParams, PheroContext, NextFunction } from '@phero/server'
import { verifyIdToken } from 'some-auth-library'
import db, { Article, User } from './fake-db'

function requireUser(
  params: PheroParams, // not used in this middleware
  context: PheroContext<{ idToken: string }>, // we expect a `idToken` to be on the incoming context
  next: NextFunction<{ userId: string }>, // we'll be adding `userId` to the context, to be used later on
): User {
  const user = verifyIdToken(ctx.idToken)
  if (!user) {
    throw new Error('Authentication error')
  }
  await next({ user.uid })
}

async function createArticle(
  context: PheroContext<{ userId: string }>,
  article: Article,
): Promise<void> {
  return db.articles.create({
    article,
    createdBy: context.userId,
  })
}

async function deleteArticle(id: string): Promise<void> {
  return db.articles.delete(id)
}

export const articleService = createService({
  createArticle,
  deleteArticle,
}, {
  middleware: [requireUser]
})
```

Instead of calling `requireUser` for each function (based on separate `idToken` arguments), we now define a single middleware function for all functions of the service.

On the client side, we should provide the context to the service:

```ts
const client = new PheroClient(fetch, PHERO_URL, {
  context: {
    articleService: async () => {
      const idToken = await yourFavoriteAuthLib.getIdToken()
      return { idToken }
    }
  }
});

await client.articleService.deleteArticle('123')info
```

## Third party libraries

Context doesn't need to start on the client, in some cases it's useful on the server alone. This could be a third-party library where you need an instance for. You could initiate it once in a separate file and import it in your Phero functions, but you can also use context and middleware for that:

```ts
import {
  createService,
  PheroParams,
  PheroContext,
  NextFunction,
} from "@phero/server"
import someDB from "some-db-library"

function databaseMiddleware(
  params: PheroParams, // not used in this middleware
  context: PheroContext, // not used in this middleware
  next: NextFunction<{ db: DB }>, // we'll be adding `db` to the context, to be used later on
): User {
  const db = await someDb.connect()
  await next({ db })
}

async function createArticle(
  context: PheroContext<{ db: DB }>,
  article: Article,
): Promise<void> {
  return context.db.articles.create({ article })
}

async function deleteArticle(
  context: PheroContext<{ db: DB }>,
  id: string,
): Promise<void> {
  return context.db.articles.deleteById(id)
}

export const articleService = createService(
  {
    createArticle,
    deleteArticle,
  },
  {
    middleware: [databaseMiddleware],
  },
)
```

### Logging

Middleware does not have to work together with context, in some cases it's enough on its own. Take logging for example:

```ts
import {
  createService,
  PheroParams,
  PheroContext,
  NextFunction,
} from "@phero/server"
import logger from "some-log-library"

function logMiddleware(
  params: PheroParams, // not used in this middleware
  context: PheroContext, // not used in this middleware
  next: NextFunction, // not used in this middleware
): User {
  const t = Date.now()
  logger.info("Started request")
  await next()
  logger.info(`Ended request in ${Date.now() - t}ms`)
}

async function createArticle(article: Article): Promise<void> {
  // ...
}

async function deleteArticle(id: string): Promise<void> {
  // ...
}

export const articleService = createService(
  {
    createArticle,
    deleteArticle,
  },
  {
    middleware: [logMiddleware],
  },
)
```

## Combining middleware

You can use multiple middleware for each service. These functions are called in order of your definition in the service configuration. Each middleware function defines its own requirements on incoming context and what it adds to the context, it doesn't need to take into account what other middleware functions do. In the same manner, each Phero function defines what it needs from the incoming context and it can leave out what it doesn't use.

Taking this into account, a complete example of the above would be:

```ts
import { verifyIdToken } from "some-auth-library"
import logger from "some-log-library"
import someDB from "some-db-library"

function logMiddleware(
  params: PheroParams, // not used in this middleware
  context: PheroContext, // not used in this middleware
  next: NextFunction, // not used in this middleware
): User {
  const t = Date.now()
  logger.info("Started request")
  await next()
  logger.info(`Ended request in ${Date.now() - t}ms`)
}

function databaseMiddleware(
  params: PheroParams, // not used in this middleware
  context: PheroContext, // not used in this middleware
  next: NextFunction<{ db: DB }>, // we'll be adding `db` to the context, to be used later on
): User {
  const db = await someDb.connect()
  await next({ db })
}

function requireUser(
  params: PheroParams, // not used in this middleware
  context: PheroContext<{ db: DB; idToken: string }>, // we expect a `db` and `idToken` to be on the incoming context
  next: NextFunction<{ user: User }>, // we'll be adding `user` to the context, to be used later on
): User {
  const { uid } = verifyIdToken(context.idToken)
  if (!uid) throw new Error("Authentication error")

  const user = await context.db.getUser(uid)
  if (!user) throw new Error("User not found")

  await next({ user })
}

async function createArticle(
  context: PheroContext<{ db: Db; user: User }>,
  article: Article,
): Promise<void> {
  return context.db.articles.create({
    article,
    createdBy: context.user.id,
  })
}

async function deleteArticle(
  context: PheroContext<{ db: Db }>,
  articleId: string,
): Promise<void> {
  return context.db.articles.deleteById(articleId)
}

export const articleService = createService(
  {
    createArticle,
    deleteArticle,
  },
  {
    middleware: [logMiddleware, databaseMiddleware, requireUser],
  },
)
```
