export const handleAsyncOnPress = ({
  action,
  error
}: {
  action: () => Promise<void>
  error: (reason: unknown) => void
}): void => {
  action().catch(error)
}
