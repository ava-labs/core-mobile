import url from 'url'
import { PixelRatio } from 'react-native'

export const formatUriImageToPng = (
  uri: string,
  size: number,
  pixelRatio: number = PixelRatio.get()
): string => {
  if (isContentfulImageUri(uri)) {
    const sizeInPixel = Math.floor(size * pixelRatio)

    return uri?.endsWith('.svg')
      ? `${uri}?fm=png&w=${sizeInPixel}&h=${sizeInPixel}&fit=scale`
      : uri
  }
  return uri
}

export const isContentfulImageUri = (uri: string): boolean => {
  const allowedHosts = ['images.ctfassets.net']
  const allowedUrl = 'https://images.ctfassets.net'
  const host = url.parse(uri, false).host
  return !!host && allowedHosts.includes(host) && uri.startsWith(allowedUrl)
}
