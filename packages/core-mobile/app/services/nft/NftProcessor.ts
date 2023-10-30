import { Image } from 'react-native'
import { NFTItemData, NFTItemExternalData } from 'store/nft'
import { HttpClient } from '@avalabs/utils-sdk'
import { NftTokenMetadataStatus } from '@avalabs/glacier-sdk'
import Logger from 'utils/Logger'
import { convertIPFSResolver, getTokenUri, isErc721 } from './utils'

export class NftProcessor {
  private base64 = require('base-64')
  private base64Prefix = 'data:image/svg+xml;base64,'
  private metadataHttpClient = new HttpClient(``, {})

  fetchImageAndAspect(imageData: string) {
    return new Promise<[string, number, boolean]>(resolve => {
      if (this.isBase64Svg(imageData)) {
        const svg = this.decodeBase64Svg(imageData)
        const trimmed = this.removeSvgNamespace(svg)
        const aspect = this.extractSvgAspect(trimmed) ?? 1
        resolve([svg, aspect, true])
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
                  resolve([trimmed, aspect, true])
                })
                .catch(Logger.error)
            })
            .catch(Logger.error)
        } else if (imageUrl.endsWith('.mp4')) {
          // we don't support mp4 yet
          resolve(['', 1, false])
        } else {
          // assume this is just a normal image
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

  removeSvgNamespace(svg: string): string {
    const regex = new RegExp('(</*)(.+?:)', 'ig')
    return svg.replace(regex, '$1')
  }

  extractSvgAspect(svg: string) {
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

  async applyMetadata(nft: NFTItemData): Promise<NFTItemData> {
    if (nft.external_url) {
      //already has metadata
      return nft
    }

    if (nft.metadata.indexStatus !== NftTokenMetadataStatus.INDEXED) {
      const metadata = await this.fetchMetadata(getTokenUri(nft))
      // do not use spread operator on metadata to prevent overwriting core NFT properties
      return {
        ...nft,
        attributes: metadata.attributes ?? [],
        external_url: metadata.external_url ?? '',
        metadata: {
          ...nft.metadata,
          name: metadata.name ?? '',
          imageUri: metadata.image ?? '',
          description: metadata.description ?? '',
          externalUrl: metadata.external_url ?? '',
          animationUri: metadata.animation_url ?? ''
        }
      }
    }

    try {
      return {
        ...nft,
        attributes:
          JSON.parse(
            (isErc721(nft)
              ? nft.metadata.attributes
              : nft.metadata.properties) || ''
          ) ?? [],
        external_url: nft.metadata.externalUrl ?? ''
      }
    } catch (e) {
      return {
        ...nft,
        attributes: [],
        external_url: nft.metadata.externalUrl ?? ''
      }
    }
  }

  async fetchMetadata(tokenUri: string) {
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
