module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: "standard-with-typescript",
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json", // <-- Point to your project's tsconfig.json or create new one
  },
  // parser: '@typescript-eslint/parser',
  rules: {
    "deprecation/deprecation": "error",
    "@typescript-eslint/comma-dangle": ["error", "always-multiline"],
    "@typescript-eslint/quotes": [
      "error",
      "double",
      { allowTemplateLiterals: true },
    ],
    "@typescript-eslint/space-before-function-paren": ["error", "never"],
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/member-delimiter-style": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/brace-style": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/no-extraneous-class": "off",
  },
  plugins: ["deprecation"],
}
