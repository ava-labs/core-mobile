// Kit errors are plain objects (`{ _tag, errorCode, message }`,
// `{ _tag, originalError }`) that don't extend Error, so template-literal
// interpolation yields "[object Object]". Flatten them into text so the status
// word in errorCode reaches LEDGER_ERROR_CODES matching.
export const describeDmkError = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (error === null || typeof error !== 'object') return String(error)

  const { _tag, errorCode, message, originalError } = error as {
    _tag?: unknown
    errorCode?: unknown
    message?: unknown
    originalError?: unknown
  }
  if (typeof _tag !== 'string') return toJson(error)

  const parts = [_tag]
  if (typeof errorCode === 'string' && errorCode.length > 0) {
    parts.push(errorCode)
  }
  if (typeof message === 'string' && message.length > 0) parts.push(message)
  if (originalError instanceof Error) parts.push(originalError.message)
  return parts.join(': ')
}

const toJson = (error: object): string => {
  try {
    return JSON.stringify(error, (_key, value) =>
      value instanceof Error
        ? { name: value.name, message: value.message }
        : value
    )
  } catch {
    return String(error)
  }
}
