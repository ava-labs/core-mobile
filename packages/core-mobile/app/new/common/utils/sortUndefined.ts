export const sortUndefined = (a?: number, b?: number): number => {
  if (a === undefined && b === undefined) return 0
  else if (b === undefined) return 1
  else if (a === undefined) return -1
  else return a - b
}
