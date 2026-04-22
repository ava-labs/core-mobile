import { Image } from 'react-native'
import { NFTItemExternalData, NftContentType } from 'store/nft'
import Logger from 'utils/Logger'
import { NftImageData, NftItemExternalData } from './types'
import { convertIPFSResolver } from './utils'

export class NftProcessor {
  private base64 = require('base-64')
  private base64Prefix = 'data:image/svg+xml;base64,'

  fetchImageAndAspect(imageData: string): Promise<NftImageData> {
    return new Promise<NftImageData>(resolve => {
      if (this.isBase64Svg(imageData)) {
        const svg = this.decodeBase64Svg(imageData)
        const trimmed = this.removeSvgNamespace(svg)
        const aspect = this.extractSvgAspect(trimmed) ?? 1
        resolve({ image: svg, aspect, isSvg: true, type: NftContentType.SVG })
      } else {
        const imageUrl = convertIPFSResolver(imageData)
        this.identifyByMagicNumber(imageUrl)
          .then(type => {
            if (type === NftContentType.SVG) {
              resolve({
                image: imageUrl,
                aspect: 1,
                isSvg: false,
                type
              })
            } else if (type === NftContentType.MP4) {
              resolve({
                video: imageUrl,
                image: '',
                aspect: 1,
                isSvg: false,
                type
              })
            } else {
              Image.getSize(
                imageUrl,
                (width: number, height: number) => {
                  const aspect = height / width
                  resolve({
                    image: imageUrl,
                    aspect: isNaN(aspect) ? 1 : aspect,
                    isSvg: false,
                    type
                  })
                },
                error => {
                  resolve({ image: imageUrl, aspect: 1, isSvg: false, type })
                  Logger.error(error)
                }
              )
            }
          })
          .catch(error => {
            Logger.error('Error fetching image and aspect:', error)
            resolve({
              image: '',
              aspect: 1,
              isSvg: false,
              type: NftContentType.Unknown
            })
          })
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

  private async identifyByMagicNumber(url: string): Promise<NftContentType> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-256' } // Increased range for better detection
      })

      if (!response.ok) return NftContentType.Unknown

      const buffer = await response.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      const textDecoder = new TextDecoder()
      const snippet = textDecoder.decode(buffer).trimStart()

      if (this.isJpeg(uint8Array)) return NftContentType.JPG
      if (this.isPng(uint8Array)) return NftContentType.PNG
      if (this.isGif(uint8Array)) return NftContentType.GIF
      if (this.isSvg(snippet)) return NftContentType.SVG
      if (this.isMp4(uint8Array)) return NftContentType.MP4

      return NftContentType.Unknown
    } catch (error) {
      return NftContentType.Unknown
    }
  }

  private isJpeg(uint8Array: Uint8Array): boolean {
    return (
      uint8Array[0] === 0xff && uint8Array[1] === 0xd8 && uint8Array[2] === 0xff
    )
  }

  private isPng(uint8Array: Uint8Array): boolean {
    return (
      uint8Array[0] === 0x89 &&
      uint8Array[1] === 0x50 &&
      uint8Array[2] === 0x4e &&
      uint8Array[3] === 0x47
    )
  }

  private isGif(uint8Array: Uint8Array): boolean {
    return (
      uint8Array[0] === 0x47 &&
      uint8Array[1] === 0x49 &&
      uint8Array[2] === 0x46 &&
      uint8Array[3] === 0x38 &&
      ((uint8Array[4] === 0x37 && uint8Array[5] === 0x61) || // GIF87a
        (uint8Array[4] === 0x39 && uint8Array[5] === 0x61)) // GIF89a
    )
  }

  private isSvg(snippet: string): boolean {
    return snippet.startsWith('<?xml') || snippet.startsWith('<svg')
  }

  private isMp4(uint8Array: Uint8Array): boolean {
    return (
      String.fromCharCode(
        uint8Array[4] ?? 0,
        uint8Array[5] ?? 0,
        uint8Array[6] ?? 0,
        uint8Array[7] ?? 0
      ) === 'ftyp'
    )
  }

  async fetchMetadata(tokenUri: string): Promise<NFTItemExternalData> {
    const base64MetaPrefix = 'data:application/json;base64,'
    if (tokenUri.startsWith(base64MetaPrefix)) {
      const base64Metadata = tokenUri.substring(base64MetaPrefix.length)
      const metadata = JSON.parse(
        Buffer.from(base64Metadata, 'base64').toString()
      )
      return metadata as NftItemExternalData
    } else {
      const ipfsPath = convertIPFSResolver(tokenUri)

      const response = await fetch(ipfsPath)

      if (!response.ok) {
        throw new Error(
          `[NftProcessor] fetchMetadata error from ${ipfsPath} with status code ${response.status}`
        )
      }

      return await response.json()
    }
  }
}

export default new NftProcessor()
