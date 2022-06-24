export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as any).code === "string"
  )
}
