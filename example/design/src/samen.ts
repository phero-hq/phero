import {
  editArticle,
  publishArticle,
  removeArticle,
  requireAuthorRole,
} from "./funcs"
import { createFunction, createService } from "./smn"

export async function getArticle() {
  return "10"
}

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
  // getArticleX: createFunction(getArticle),
  publishArticle: createFunction(publishArticle),
})

const aad = 10
export const aadx = 10
