import {
  editArticle,
  publishArticle,
  removeArticle,
  requireAuthorRole,
} from "./funcs"
import { createFunction, createService } from "./smn"

interface Aad {
  kaas: string
}

export function getArticle(aad: number) {
  return 10
}

// export const cmsService = createService(
//   {
//     getArticle,

//     editArticle: createFunction(editArticle, {
//       memory: 2048,
//       // middlewares: [requireAuthorRole],
//     }),

//     // removeArticle: createFunction(removeArticle, {
//     //   // middlewares: [requireAdminRole],
//     // }),

//     // publishArticle: createFunction(publishArticle, {
//     //   memory: 2048,
//     // }),
//   },
//   {
//     memory: 1024,
//     minInstance: 1,
//     maxInstance: 4,
//     // middlewares: [requireCmsUser],
//   },
// )

// export const aad = {
//   config: {
//     memory: 123,
//   },
// }

// export const testService = createService(xxx())

// function xxx() {
//   return {
//     aad: () => 10,
//   }
// }

// export default createService(xxx())

export const cmsService = createService(
  {
    getArticle: createFunction(getArticle),
    editArticle: createFunction(editArticle, {
      memory: 2048,
      middleware: [requireAuthorRole],
    }),
  },
  {
    memory: 1024,
    timeout: 10,
  },
)

export const testService = createService({
  publishArticle: createFunction(publishArticle),
})
