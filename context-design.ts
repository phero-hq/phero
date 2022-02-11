const samenClient = new SamenClient()

const articleServiceContext = () => ({ idToken: getIdToken() })
const editArticleContext = () => ({ isArticleAuthor: getIsArticleAuthor() })

// GLOBAL CONTEXT rpc call
export const articleService = samenClient.createArticleService(
  articleServiceContext,
)
articleService.editArticle("id")

// LOCAL CONTEXT rpc call
samenClient.articleService.editArticle("id", articleServiceContext)

// GLOBAL CONTEXT rpc call 2-levels
const editArticle = samenClient
  .createArticleService(articleServiceContext)
  .createEditArticle(editArticleContext)
editArticle("id")

// LOCAL CONTEXT rpc call 2-levels
samenClient.articleService.editArticle("id", {
  ...editArticleContext,
  ...articleServiceContext,
})

//

export const articleService = samenClient.createArticleService(
  articleServiceContext,
)
