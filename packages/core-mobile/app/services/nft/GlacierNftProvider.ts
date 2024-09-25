import { NftProvider } from 'services/nft/types'
import { NFTItemData } from 'store/nft'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import GlacierService from 'services/GlacierService'
import { addMissingFields } from './utils'

const demoAddress = '0x188c30e9a6527f5f0c3f7fe59b72ac7253c62f28'

export class GlacierNftProvider implements NftProvider {
  async isProviderFor(chainId: number): Promise<boolean> {
    return await GlacierService.isNetworkSupported(chainId)
  }

  async fetchNft(
    chainId: number,
    address: string,
    tokenId: string
  ): Promise<NFTItemData> {
    const response = await GlacierService.getTokenDetails({
      chainId: chainId.toString(),
      address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
      tokenId: tokenId
    })

    return {
      ...addMissingFields(response, address)
    }
  }

  async reindexNft(
    address: string,
    chainId: number,
    tokenId: string
  ): Promise<void> {
    await GlacierService.reindexNft({
      address,
      chainId: chainId.toString(),
      tokenId
    })
  }
}

export default new GlacierNftProvider()
