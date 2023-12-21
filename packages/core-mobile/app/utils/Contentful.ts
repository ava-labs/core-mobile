import { PixelRatio } from 'react-native'

export const formatUriImageToPng = (
  uri: string,
  size: number,
  pixelRatio: number = PixelRatio.get()
): string => {
  if (isContentfulImageUri(uri)) {
    const sizeInPixel = Math.floor(size * pixelRatio)

    return uri?.endsWith('.svg')
      ? `${uri}?fm=png&w=${sizeInPixel}&h=${sizeInPixel}`
      : uri
  }
  return uri
}

export const isContentfulImageUri = (uri: string): boolean => {
  const allowedUrl = 'https://images.ctfassets.net'

  return uri.startsWith(allowedUrl)
}
