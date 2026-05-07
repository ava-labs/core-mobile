import { NftContentType, NftImageData, NftItemExternalData } from './types'
import { convertIPFSResolver } from './utils'

const BASE64_SVG_PREFIX = 'data:image/svg+xml;base64,'

export class NftProcessor {
  async fetchImage(imageData: string): Promise<NftImageData> {
    if (!imageData) {
      throw new Error('[NftProcessor] fetchImage called with empty uri')
    }

    if (imageData.startsWith(BASE64_SVG_PREFIX)) {
      return { uri: imageData, type: NftContentType.SVG }
    }

    const imageUrl = convertIPFSResolver(imageData)
    const type = await this.identifyByMagicNumber(imageUrl)
    return { uri: imageUrl, type }
  }

  private async identifyByMagicNumber(url: string): Promise<NftContentType> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-256' }
    })

    if (!response.ok) {
      throw new Error(`[NftProcessor] HTTP ${response.status} fetching ${url}`)
    }

    const buffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    const snippet = new TextDecoder().decode(buffer).trimStart()

    if (this.isJpeg(uint8Array)) return NftContentType.JPG
    if (this.isPng(uint8Array)) return NftContentType.PNG
    if (this.isGif(uint8Array)) return NftContentType.GIF
    if (this.isSvg(snippet)) return NftContentType.SVG
    if (this.isMp4(uint8Array)) return NftContentType.MP4

    return NftContentType.Unknown
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

  async fetchMetadata(tokenUri: string): Promise<NftItemExternalData> {
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
