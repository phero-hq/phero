import { Kaas } from "./other"

export function getArticle() {}
export async function editArticle() {
  return true
}
export function removeArticle() {}

export function deployStaticWebsite() {}

export function requireCmsUser() {}
export function requireAdminRole() {}
export function requireAuthorRole() {}

// enum Author {
//   Author1,
//   Author2,
// }

// interface Article {
//   id: string
//   title: string
//   // author: Author
// }

// interface Article {
//   text: string
// }

// type User = {
//   aad: number
// }
interface Kees extends Kaas {
  aad: number
}

export async function publishArticle(): Promise<Kees> {
  // aad: { a: string },
  // user: User,
  // user2: User,
  // user3: Kees,
  return {
    aad: 1,
    asdsd: "",
  }
}
