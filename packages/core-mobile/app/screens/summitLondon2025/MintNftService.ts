import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { CoreSummitNft__factory } from 'contracts/summitLondon2025'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { MintNftSigner } from './MintNftSigner'
import fetchWithAppCheck from './fetchWithAppCheck'

export class MintNftService {
  static async mint({
    request,
    address,
    provider,
    isTestnet
  }: {
    request: Request
    address: string
    provider: JsonRpcBatchInternal
    isTestnet: boolean
  }): Promise<void> {
    const baseUrl = isTestnet
      ? 'https://proxy-api-dev.avax.network'
      : 'https://proxy-api.avax.network'
    const url = `${baseUrl}/nft-mint-signature/${address}`
    const signatureRequest = await fetchWithAppCheck({
      url,
      method: 'GET'
    })
    const { hex: signatureHex } = await signatureRequest.json()

    const contractAddress = getContractAddress(isTestnet)
    const signer = new MintNftSigner(provider, request, address)

    const contract = CoreSummitNft__factory.connect(contractAddress, signer)

    const tx = await contract.freeCoffee(signatureHex)

    await tx.wait()
  }
}

const getContractAddress = (isTestnet: boolean): string => {
  if (isTestnet) {
    return Summit2025MintNftContractAddress.Testnet
  }

  return Summit2025MintNftContractAddress.Mainnet
}

enum Summit2025MintNftContractAddress {
  Testnet = '0x2541D261d60FF6488A9C506A7D4cfA9c3337F5fC',
  Mainnet = '0x9FE2b0BdDb9d6D11709ac2c789D2cefFCE86F882'
}
