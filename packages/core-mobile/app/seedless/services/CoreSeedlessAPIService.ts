import Config from 'react-native-config'

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
  async register(oidcToken: string): Promise<SeedlessUserRegistrationResult> {
    // Extract user identity from token
    const payload = JSON.parse(
      Buffer.from(oidcToken.split('.')?.[1] ?? '', 'base64').toString('utf8')
    )
    const iss = payload.iss
    const sub = payload.sub
    const email = payload.email

    try {
      const response = await fetch(Config.SEEDLESS_URL + '/v1/register', {
        method: 'POST',
        body: JSON.stringify({
          iss,
          sub,
          email
        }),
        headers: {
          Authorization: `${Config.SEEDLESS_API_KEY}`
        }
      })

      const body = await response.json()

      if (body.message === 'USER_ALREADY_EXISTS') {
        return SeedlessUserRegistrationResult.ALREADY_REGISTERED
      }
      return SeedlessUserRegistrationResult.APPROVED
    } catch (error) {
      return SeedlessUserRegistrationResult.ERROR
    }
  }
}

export default new CoreSeedlessAPIService()
