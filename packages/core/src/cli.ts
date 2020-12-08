import ora from "ora"

export enum Environment {
  production = "production",
  development = "development",
}

export function getEnvironment(): Environment {
  if (process.argv.includes("--production")) return Environment.production
  if (process.env.NODE_ENV === "production") return Environment.production
  return Environment.development
}

export function startSpinner(message: string) {
  return ora(message).start()
}
