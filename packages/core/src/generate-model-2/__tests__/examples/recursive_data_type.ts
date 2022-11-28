export function getTree1(): Tree<number> {
  throw new Error()
}

export function getTree2(): NumberTree {
  throw new Error()
}

export function getTree3(): NumberTree[] {
  throw new Error()
}

type NumberTree = Tree<number>

type Tree<T> = Leaf<T> | Branch<T>

interface Leaf<A> {
  type: "leaf"
  value: A
}

interface Branch<A> {
  type: "branch"
  left: Tree<A>
  right: Tree<A>
}
