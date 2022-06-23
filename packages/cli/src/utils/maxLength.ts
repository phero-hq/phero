export default function maxLength(arr: string[]): number {
  let result = 0
  for (const item of arr) {
    if (item.length > result) {
      result = item.length
    }
  }
  return result
}
