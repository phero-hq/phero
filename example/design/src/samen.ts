import { createFunction, createService } from "./smn"

// const getArticle = async (): Promise<string> => {
//   return "10"
// }

interface Kees {
  aad: number
}

interface Banaan {
  zaad: number
  hallo: number
  zaza: number
  kees: number
  aad: Aad<Omit<Banaan, "zaad">>
}

type Aad<
  X extends number | string | boolean | Omit<Banaan, "zaad"> = Omit<
    Banaan,
    "zaad"
  >,
> = {
  a: X
  z: Pick<Banaan, "zaza"> & Kees & Pick<Banaan, "hallo">

  aad: {
    [z: string]: Omit<Banaan, "kees">
  }
}

type Kaas = Omit<Banaan, "hallo">

async function getArticle(
  x: Pick<Banaan, "zaad">,
  // y: Aad<null>,
  z: Aad<10>,
  // a: Aad<true>,
  // b: Aad<Aad<Date>>,
  // c: Aad<Date>,
): Promise<Map<Aad<10>, Kaas>> {
  return new Map<Aad<10>, Kaas>()
}

// interface Banaan {
//   zaad: number
//   hallo: number
// }

// type Aad<X extends number | Omit<Banaan, "zaad">> = {
//   a: X
// }

// async function getArticle(c: Aad<number>): Promise<Omit<Banaan, "zaad">> {
//   return {
//     // a: 10,
//     hallo: c.a,
//   }
// }

export const testService = createService({
  getArticleX: createFunction(getArticle),
})
