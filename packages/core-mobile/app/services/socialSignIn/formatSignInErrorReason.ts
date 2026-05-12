export const formatSignInErrorReason = (error: unknown): string => {
  try {
    const detail = error instanceof Error ? error.message : String(error)
    if (error && typeof error === 'object' && 'code' in error) {
      const value = (error as { code: unknown }).code
      if (value !== undefined && value !== null) {
        return `${String(value)}: ${detail}`
      }
    }
    return detail
  } catch {
    return 'unserializable error'
  }
}
