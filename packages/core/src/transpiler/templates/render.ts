import prettier from "prettier"

export default function render(code: string) {
  return prettier.format(code, { parser: "typescript" })
}
