import prettier from "prettier";

export const formatCode = (s: string) =>
  prettier.format(s, { parser: "typescript" });
