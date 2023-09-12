import { PixelRatio } from 'react-native'

export const formatUriImageToPng = (uri: string, size: number) => {
  const allowedUrl = 'https://images.ctfassets.net'
  if (uri.startsWith(allowedUrl)) {
    const sizeInPixel = size * PixelRatio.get()

    return uri?.endsWith('.svg')
      ? `${uri}?fm=png&w=${sizeInPixel}&h=${sizeInPixel}`
      : uri
  }
  return uri
}
