export const getSocialHandle = (url: string): string | undefined => {
  const match = url.match(
    /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([^/?]+)/
  )
  return match?.[1]
}
