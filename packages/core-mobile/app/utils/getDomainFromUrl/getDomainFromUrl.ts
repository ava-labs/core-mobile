// https://www.google.com/ -> google.com
export const getDomainFromUrl = (url: string): string => {
  return url
    ?.replace(/^https?:\/\//, '')
    ?.replace(/^www\./, '')
    ?.replace(/\/$/, '')
}
