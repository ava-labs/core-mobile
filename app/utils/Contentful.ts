import { PixelRatio } from 'react-native'

export const formatUriImageToPng = (
  uri: string,
  size: number,
  pixelRatio: number = PixelRatio.get()
) => {
  const allowedUrl = 'https://images.ctfassets.net'
  if (uri.startsWith(allowedUrl)) {
    const sizeInPixel = size * pixelRatio

    return uri?.endsWith('.svg')
      ? `${uri}?fm=png&w=${sizeInPixel}&h=${sizeInPixel}`
      : uri
  }
  return uri
}
