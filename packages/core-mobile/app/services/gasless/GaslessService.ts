import AppCheckService from 'services/fcm/AppCheckService'
import { FundResult, GaslessSdk } from '@avalabs/core-gasless-sdk'
import { SigningData_EthSendTx } from '@avalabs/vm-module-types'
import { Transaction } from 'ethers'
import { TransactionLike } from 'ethers/src.ts/transaction/transaction'
import Config from 'react-native-config'
import Logger from 'utils/Logger'

if (!Config.GAS_STATION_URL) {
  Logger.warn(
    'GAS_STATION_URL is missing. Gasless service may not work properly.'
  )
}

class GaslessService {
  private sdk = new GaslessSdk({
    gasStationUrl: Config.GAS_STATION_URL
  })

  private getSdk: () => Promise<GaslessSdk> = async () => {
    const appCheckToken = (await AppCheckService.getToken()).token
    this.sdk.setAppCheckToken(appCheckToken)
    return this.sdk
  }

  isEligibleForChain: (chainId: string) => Promise<boolean> = async (
    chainId: string
  ) => {
    const sdk = await this.getSdk()
    return await sdk.isEligibleForChain(chainId)
  }

  fundTx: (
    signingData: SigningData_EthSendTx,
    addressFrom: string
  ) => Promise<FundResult> = async (
    signingData: SigningData_EthSendTx,
    addressFrom: string
  ) => {
    const sdk = await this.getSdk()
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
