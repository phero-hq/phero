import {
  editArticle,
  publishArticle,
  removeArticle,
  requireAuthorRole,
} from "./funcs"
import { createFunction, createService } from "./smn"

// interface Aad {
//   kaas: string
// }

// interface User {
//   id: string
//   age: number
// }

// export async function getArticle() {
//   return "10"
// }

// export const cmsService = createService(
//   {
//     getArticleX: createFunction(getArticle),
//     editArticle: createFunction(editArticle, {
//       memory: 2048,
//       middleware: [requireAuthorRole],
//     }),
//   },
//   {
//     memory: 1024,
//     timeout: 10,
//   },
// )

export const testService = createService({
  publishArticle: createFunction(publishArticle),
})

// const aad = 10
// const aadx = 10

// export const zaadService = createService({
//   removeArticle: createFunction(removeArticle),
// })
