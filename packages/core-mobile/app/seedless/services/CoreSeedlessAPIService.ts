import { IdentityProof } from '@cubist-labs/cubesigner-sdk'
import Config from 'react-native-config'
import Logger from 'utils/Logger'

if (!Config.SEEDLESS_URL) {
  throw Error('SEEDLESS_URL is missing. Please check your env file.')
}

if (!Config.SEEDLESS_API_KEY) {
  throw Error('SEEDLESS_API_KEY is missing. Please check your env file.')
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
class CoreSeedlessAPIService {
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
            Authorization: `${Config.SEEDLESS_API_KEY}`,
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
    const response = await fetch(Config.SEEDLESS_URL + '/v1/addAccount', {
      method: 'POST',
      headers: {
        Authorization: `${Config.SEEDLESS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountIndex,
        identityProof,
        mnemonicId
      })
    })

    if (!response.ok) {
      Logger.error('Adding new account failed')
      Logger.info(`${response.status}`, await response.json())
      throw new Error('Adding new account failed')
    }
  }
}

export default new CoreSeedlessAPIService()
