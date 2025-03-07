import { FundResult, GaslessSdk } from '@avalabs/core-gasless-sdk'
import {
  RpcMethod,
  SigningData,
  SigningData_EthSendTx
} from '@avalabs/vm-module-types'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'
import { Transaction, TransactionLike } from 'ethers'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { resolve } from '@avalabs/core-utils-sdk'
import { FundTxParams } from 'services/gasless/types'

if (!Config.GAS_STATION_URL) {
  Logger.warn(
    'GAS_STATION_URL is missing. Gasless service may not work properly.'
  )
}

const SUPPORTED_GASLESS_METHODS = [RpcMethod.ETH_SEND_TRANSACTION]

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
    return await sdk.isEligibleForChain({ chainId })
  }

  isEligibleForTxType = (signingData: SigningData): boolean => {
    return SUPPORTED_GASLESS_METHODS.includes(signingData.type)
  }

  isEthSendTx = (
    signingData: SigningData
  ): signingData is SigningData_EthSendTx => {
    return signingData.type === RpcMethod.ETH_SEND_TRANSACTION
  }

  fundTx = async ({
    signingData,
    addressFrom,
    provider,
    maxFeePerGas
  }: FundTxParams): Promise<FundResult> => {
    const sdk = await this.getSdk()
    if (!sdk) {
      return {
        error: {
          category: 'DO_NOT_RETRY',
          message: 'INTERNAL_ERROR'
        }
      }
    }

    if (!this.isEthSendTx(signingData)) {
      return {
        error: {
          category: 'DO_NOT_RETRY',
          message: 'INVALID_PAYLOAD'
        }
      }
    }

    const { difficulty, challengeHex } = await sdk.fetchChallenge()
    const { solutionHex } = await sdk.solveChallenge(challengeHex, difficulty)
    const txHex = Transaction.from({
      ...signingData.data,
      maxFeePerGas,
      from: null
    } as TransactionLike).unsignedSerialized

    const result = await sdk.fundTx({
      challengeHex,
      solutionHex,
      txHex,
      from: addressFrom
    })

    if (result.txHash) {
      const isConfirmed = await this.waitForConfirmation(
        result.txHash,
        provider
      )
      if (!isConfirmed) {
        return {
          error: {
            category: 'DO_NOT_RETRY',
            message: 'INTERNAL_ERROR'
          }
        }
      }
    }

    return result
  }

  private waitForConfirmation = async (
    txHash: string,
    provider: JsonRpcBatchInternal
  ): Promise<boolean> => {
    const [receipt, error] = await resolve(
      provider.waitForTransaction(txHash, 1, 30 * 1000)
    )

    if (error) {
      Logger.error('Gasless: Error waiting for transaction confirmation', error)
      return false
    }

    return receipt?.status === 1
  }
}

export default new GaslessService()
