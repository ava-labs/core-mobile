import { PixelRatio } from 'react-native'

export const formatUriImageToPng = (
  uri: string,
  size: number,
  pixelRatio: number = PixelRatio.get()
) => {
  if (isContentfulImageUri(uri)) {
    const sizeInPixel = size * pixelRatio

    return uri?.endsWith('.svg')
      ? `${uri}?fm=png&w=${sizeInPixel}&h=${sizeInPixel}`
      : uri
  }
  return uri
}

export const isContentfulImageUri = (uri: string) => {
  const allowedUrl = 'https://images.ctfassets.net'

  return uri.startsWith(allowedUrl)
}
