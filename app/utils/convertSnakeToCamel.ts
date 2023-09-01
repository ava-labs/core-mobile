export const convertSnakeToCamel = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertSnakeToCamel(item))
  }

  const camelCaseObj = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z0-9])/g, (_, letter) =>
        letter.toUpperCase()
      )
      // @ts-ignore
      camelCaseObj[camelKey] = convertSnakeToCamel(obj[key])
    }
  }
  return camelCaseObj
}
