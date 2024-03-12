import { Image } from 'react-native'
import { NFTItemExternalData, NFTImageData } from 'store/nft'
import { HttpClient } from '@avalabs/utils-sdk'
import Logger from 'utils/Logger'
import { convertIPFSResolver } from './utils'

export class NftProcessor {
  private base64 = require('base-64')
  private base64Prefix = 'data:image/svg+xml;base64,'
  private metadataHttpClient = new HttpClient(``, {})

  fetchImageAndAspect(imageData: string): Promise<NFTImageData> {
    return new Promise<NFTImageData>(resolve => {
      if (this.isBase64Svg(imageData)) {
        const svg = this.decodeBase64Svg(imageData)
        const trimmed = this.removeSvgNamespace(svg)
        const aspect = this.extractSvgAspect(trimmed) ?? 1
        resolve({ image: svg, aspect, isSvg: true })
      } else {
        const imageUrl = convertIPFSResolver(imageData)
        if (imageUrl.endsWith('.svg')) {
          fetch(imageUrl)
            .then(rsp => {
              rsp
                .text()
                .then(svg => {
                  const trimmed = this.removeSvgNamespace(svg)
                  const aspect = this.extractSvgAspect(trimmed) ?? 1
                  resolve({ image: trimmed, aspect: aspect, isSvg: true })
                })
                .catch(Logger.error)
            })
            .catch(Logger.error)
        } else if (imageUrl.endsWith('.mp4')) {
          // we don't support mp4 yet
          resolve({ image: '', aspect: 1, isSvg: false })
        } else {
          // assume this is just a normal image
          Image.getSize(
            imageUrl,
            (width: number, height: number) => {
              const aspect = height / width
              resolve({ image: imageUrl, aspect, isSvg: false })
            },
            _ => {
              resolve({ image: imageUrl, aspect: 1, isSvg: false })
            }
          )
        }
      }
    })
  }

  private isBase64Svg(imageData: string): boolean {
    return imageData.startsWith(this.base64Prefix)
  }

  private decodeBase64Svg(svgData: string): string {
    const base64Data = svgData.substring(this.base64Prefix.length)
    return this.base64Prefix + this.base64.decode(base64Data).toString()
  }

  private removeSvgNamespace(svg: string): string {
    const regex = new RegExp('(</*)(.+?:)', 'ig')
    return svg.replace(regex, '$1')
  }

  private extractSvgAspect(svg: string): number | undefined {
    const viewBoxRegex = new RegExp('viewBox="(.*?)"', 'i')
    const viewBoxMatch = svg.match(viewBoxRegex)
    if (viewBoxMatch && viewBoxMatch.length > 1) {
      const whMatch = viewBoxMatch[1]?.split(' ')
      if (whMatch && whMatch.length === 4) {
        const height = whMatch[3]
        const width = whMatch[2]
        if (!height || !width) return undefined
        return Number.parseInt(height) / Number.parseInt(width)
      }
    }
    return undefined
  }

  async fetchMetadata(tokenUri: string): Promise<NFTItemExternalData> {
    const base64MetaPrefix = 'data:application/json;base64,'
    if (tokenUri.startsWith(base64MetaPrefix)) {
      const base64Metadata = tokenUri.substring(base64MetaPrefix.length)
      const metadata = JSON.parse(
        Buffer.from(base64Metadata, 'base64').toString()
      )
      return metadata as NFTItemExternalData
    } else {
      const ipfsPath = convertIPFSResolver(tokenUri)
      const metadata: NFTItemExternalData = await this.metadataHttpClient.get(
        ipfsPath
      )

      return metadata
    }
  }
}

export default new NftProcessor()
