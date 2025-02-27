import { FundResult, GaslessSdk } from '@avalabs/core-gasless-sdk'
import { SigningData_EthSendTx } from '@avalabs/vm-module-types'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'
import { Transaction, TransactionLike } from 'ethers'

if (!Config.GAS_STATION_URL) {
  Logger.warn(
    'GAS_STATION_URL is missing. Gasless service may not work properly.'
  )
}

class GaslessService {
  private sdk: GaslessSdk | null = null

  constructor() {
    if (Config.GAS_STATION_URL) {
      this.sdk = new GaslessSdk(Config.GAS_STATION_URL)
    }
  }

  private getSdk = async (): Promise<GaslessSdk | null> => {
    if (!this.sdk) {
      return null
    }
    const appCheckToken = (await AppCheckService.getToken()).token
    this.sdk.setAppCheckToken(appCheckToken)
    return this.sdk
  }

  isEligibleForChain = async (chainId: string): Promise<boolean> => {
    const sdk = await this.getSdk()
    if (!sdk) return false
    return await sdk.isEligibleForChain(chainId)
  }

  fundTx = async (
    signingData: SigningData_EthSendTx,
    addressFrom: string
  ): Promise<FundResult> => {
    const sdk = await this.getSdk()
    if (!sdk) {
      return {
        error: {
          category: 'DO_NOT_RETRY',
          message: 'INTERNAL_ERROR'
        }
      }
    }

    const { difficulty, challengeHex } = await sdk.fetchChallenge()
    const { solutionHex } = await sdk.solveChallenge(challengeHex, difficulty)
    const txHex = Transaction.from({
      ...signingData.data,
      from: null
    } as TransactionLike).unsignedSerialized
    return await sdk.fundTx({
      challengeHex,
      solutionHex,
      txHex,
      from: addressFrom
    })
  }
}

export default new GaslessService()
