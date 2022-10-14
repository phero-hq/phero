---
sidebar_position: 3
---

Phero functions act like regular, local functions in your app. In that sense, you'd expect you can throw an error in the function and catch it in the client, right? Right!

```ts
import { createService } from "@phero/server"
import db, { Article } from "./fake-db"

class ArticleNotFoundError extends Error {}

async function getArticle(id: string): Promise<Article> {
  const article = await db.find(id)
  if (!article) {
    throw new ArticleNotFoundError()
  }
  return article
}

export const articleService = createService({ getArticle })
```

With this you can catch it on the frontend, like you would with any other error:

```ts
import {
  PheroClient,
  articleService,
  ArticleNotFoundError,
} from "./phero.generated"

const fetch = window.fetch.bind(this)
const client = new PheroClient(fetch)

async function main() {
  try {
    const article = await client.articleService.getArticle("abc")
  } catch (error) {
    if (error instanceof ArticleNotFoundError) {
      console.log("Article not found")
    } else {
      console.log("Something went wrong")
    }
  }
}

main()
```

If you want to add extra properties to an error, you can do so by doing the following:

```ts
class ArticleNotFoundError extends Error {
  constructor(public id: string) {
    super("Article not found")
  }
}
```

```ts
if (error instanceof ArticleNotFoundError) {
  console.log(`Article not found by id: ${error.id}`)
}
```
