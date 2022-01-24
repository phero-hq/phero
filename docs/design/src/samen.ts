import { createFunction, createService } from "./smn"

interface Article {
  id: string
  title: string
  text: string
}
interface User {
  id: string
  name: string
}

type Thee = string | number

interface Kaas<T = Thee> {
  id: string
}

export const articleService = createService({
  getArticle: createFunction(async (kaas: Kaas<Thee>): Promise<Article> => {
    return {
      id: "id",
      text: "text",
      title: "title",
    }
  }),
})

export const cmsService = createService({
  editArticle: createFunction(async (): Promise<Article> => {
    return {
      id: "id",
      text: "text",
      title: "title",
    }
  }),
  getUser: createFunction(async (kaas: Kaas<string>): Promise<User> => {
    return {
      id: "id",
      name: "name",
    }
  }),
})
