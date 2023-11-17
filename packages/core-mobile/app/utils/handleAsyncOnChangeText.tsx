export const handleAsyncOnChangeText =
  (text: string) =>
  ({
    action,
    error
  }: {
    action: (text: string) => Promise<void>
    error: (reason: unknown) => void
  }): void => {
    action(text).catch(error)
  }
