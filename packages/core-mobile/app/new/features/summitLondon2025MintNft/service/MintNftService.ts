import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import Config from 'react-native-config'
import fetchWithAppCheck from 'utils/httpClient'
import Logger from 'utils/Logger'
import { CoreSummitNft__factory } from 'contracts/summitLondon2025'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { MintNftSigner } from '../utils/MintNftSigner'

if (!Config.PROXY_URL)
  Logger.warn(
    'PROXY_URL is missing in env file. SummitLondon2025 MintNftService service disabled.'
  )

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
    const url = `${Config.PROXY_URL}/nft-mint-signature/${address}`
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

  // todo: add mainnet contract address
  throw new Error(
    'SummitLondon2025 contract address not defined for mainnet yet'
  )
}

enum Summit2025MintNftContractAddress {
  Testnet = '0x2541D261d60FF6488A9C506A7D4cfA9c3337F5fC'
}
