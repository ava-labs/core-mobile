import { IdentityProof } from '@cubist-labs/cubesigner-sdk'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { CoreSeedlessAPIServiceNoop } from 'seedless/services/CoreSeedlessAPIServiceNoop'
import { CoreSeedlessApiInterface } from 'seedless/services/types'

if (!Config.SEEDLESS_URL) {
  Logger.warn('SEEDLESS_URL is missing in env file. Seedless is disabled.')
}

if (!Config.SEEDLESS_API_KEY) {
  Logger.warn('SEEDLESS_API_KEY is missing in env file. Seedless is disabled.')
}

export enum SeedlessUserRegistrationResult {
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  APPROVED = 'APPROVED',
  ERROR = 'ERROR'
}

/**
 * Service for core-seedless-api
 * https://github.com/ava-labs/core-seedless-api
 */
class CoreSeedlessAPIService implements CoreSeedlessApiInterface {
  constructor(private seedlessApiKey: string) {}

  async register(
    identityProof: IdentityProof
  ): Promise<SeedlessUserRegistrationResult> {
    try {
      const response = await fetch(
        Config.SEEDLESS_URL + '/v1/register?mfa-required=false',
        {
          method: 'POST',
          body: JSON.stringify(identityProof),
          headers: {
            Authorization: this.seedlessApiKey,
            'Content-Type': 'application/json'
          }
        }
      )

      const status = response.status
      const body = await response.json()
      if (status === 200) {
        return SeedlessUserRegistrationResult.APPROVED
      }

      if (body.message === 'USER_ALREADY_EXISTS') {
        return SeedlessUserRegistrationResult.ALREADY_REGISTERED
      }
      return SeedlessUserRegistrationResult.ERROR
    } catch (error) {
      return SeedlessUserRegistrationResult.ERROR
    }
  }

  async addAccount({
    accountIndex,
    identityProof,
    mnemonicId
  }: {
    accountIndex: number
    identityProof: IdentityProof
    mnemonicId: string
  }): Promise<void> {
    try {
      const response = await fetch(Config.SEEDLESS_URL + '/v1/addAccount', {
        method: 'POST',
        headers: {
          Authorization: this.seedlessApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountIndex,
          identityProof,
          mnemonicId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.status}`)
      }
    } catch (error) {
      Logger.error('Failed to fetch /v1/addAccount', error)
      throw error
    }
  }

  async deriveMissingKeys({
    identityProof,
    mnemonicId
  }: {
    identityProof: IdentityProof
    mnemonicId: string
  }): Promise<void> {
    try {
      const response = await fetch(
        Config.SEEDLESS_URL + '/v1/deriveMissingKeys',
        {
          method: 'POST',
          headers: {
            Authorization: this.seedlessApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identityProof,
            mnemonicId
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.status}`)
      }
    } catch (error) {
      Logger.error('Failed to fetch /v1/deriveMissingKeys', error)
      throw error
    }
  }
}

export default Config.SEEDLESS_API_KEY
  ? new CoreSeedlessAPIService(Config.SEEDLESS_API_KEY)
  : new CoreSeedlessAPIServiceNoop()
