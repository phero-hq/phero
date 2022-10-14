---
sidebar_position: 1
---

The entry point of a Phero server is the Phero-file. This TypeScript-file exports services, containing functions that return promises. An example of this could be:

```ts
import { createService } from "@phero/server"

async function helloWorld(name: string): Promise<string> {
  return `Hi there, ${name}!`
}

export const helloWorldService = createService({ helloWorld })
```

:::info
An explicit `Promise` return-type is required here
:::

We're exporting a service called `helloWorldService`, containing a `helloWorld` function. The names of services and functions define how you can call them in the client. For the example above, this would be:

```ts
await client.helloWorldService.helloWorld("Jim")
```

Phero doesn't care about how you write this down, or how you organise your services and functions. For small projects this could be fine. You can even inline the functions if that's your style:

```ts
import { createService } from "@phero/server"

export const helloWorldService = createService({
  helloWorld: async (name: string): Promise<string> => `Hi there, ${name}!`,
})
```

However, your functions would probably have more functionality than the examples so far. In most cases it's wise to move them out to their own files:

```ts
import { createService } from "@phero/server"

import * as userFunctions from "./user"
import * as articleFunctions from "./article"

export const userService = createService({
  login: userFunctions.login,
  register: userFunctions.register,
})

export const articleService = createService({
  getArticle: articleFunctions.get,
})
```

After the Phero client has been regenerated, these functions could be called based on the names of the services and functions:

```ts
await client.userService.login()
await client.userService.register()
await client.articleService.getArticle()
```

How you organise your functions is totally up to you. As long as Phero can find your exported services in your Phero file, it'll be all good.

## Using different kind of types

The examples so far contained primitive types like `string` and `number`, but in the real world you'd have more than that: Your app would probably contain a lot of interfaces, arrays, enums and more. Phero can do this. Let's take a look at the following Phero-file:

```ts
import { createService } from "@phero/server"
import db from "./fake-db"

interface Article {
  id: string
  title: string
  components: ArticleComponent[]
}

enum ArticleComponentType {
  Paragraph = "paragraph",
  Image = "image",
  Quote = "quote",
}

type ArticleComponent =
  | { type: ArticleComponentType.Paragraph; content: string }
  | { type: ArticleComponentType.Image; url: string }
  | { type: ArticleComponentType.Quote; quote: string; source: string }

async function getArticle(id: string): Promise<Article> {
  return db.articles.find(id)
}

async function createArticle(article: Article): Promise<void> {
  return db.articles.create(article)
}

export const articleService = createService({
  get: getArticle,
  create: createArticle,
})
```

If you call the function from the client, the argument and return-types match up:

```ts
const article = await client.articleService.get("1") // Article
const title = article.title // string
const components = article.components // ArticleComponent[]

await client.articleService.create({ id: "1", title: "Hi" }) // Property 'components' is missing
```

Types used by your functions are available from the client if you need them:

```ts
import { Article, ArticleComponentType, ArticleComponent } from "@phero/client"
```
