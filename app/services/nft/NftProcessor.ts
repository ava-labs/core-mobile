import { Image } from 'react-native'
import { convertIPFSResolver } from './utils'

export class NftProcessor {
  private base64 = require('base-64')
  private base64Prefix = 'data:image/svg+xml;base64,'

  fetchImageAndAspect(imageData: string) {
    return new Promise<[string, number, boolean]>(resolve => {
      if (this.isBase64Svg(imageData)) {
        const svg = this.decodeBase64Svg(imageData)
        const aspect = this.extractSvgAspect(svg) ?? 1

        resolve([svg, aspect, true])
      } else {
        const imageUrl = convertIPFSResolver(imageData)

        Image.getSize(
          imageUrl,
          (width: number, height: number) => {
            const aspect = height / width
            resolve([imageUrl, aspect, false])
          },
          _ => {
            resolve([imageUrl, 1, false])
          }
        )
      }
    })
  }

  isBase64Svg(imageData: string) {
    return imageData.startsWith(this.base64Prefix)
  }

  decodeBase64Svg(svgData: string): string {
    const base64Data = svgData.substring(this.base64Prefix.length)
    return this.base64Prefix + this.base64.decode(base64Data).toString()
  }

  extractSvgAspect(svg: string) {
    const viewBoxRegex = new RegExp('viewBox="(.*?)"', 'i')
    const viewBoxMatch = svg.match(viewBoxRegex)
    if (viewBoxMatch && viewBoxMatch.length > 1) {
      const whMatch = viewBoxMatch[1].split(' ')
      if (whMatch && whMatch.length === 4) {
        const height = whMatch[3]
        const width = whMatch[2]
        return Number.parseInt(height, 10) / Number.parseInt(width, 10)
      }
    }
    return undefined
  }
}

export default new NftProcessor()
