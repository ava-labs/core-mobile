import Config from 'react-native-config'

if (!Config.SEEDLESS_URL) {
  throw Error('SEEDLESS_URL is missing. Please check your env file.')
}

if (!Config.SEEDLESS_API_AUTHORIZATION_TOKEN) {
  throw Error(
    'SEEDLESS_API_AUTHORIZATION_TOKEN is missing. Please check your env file.'
  )
}

export enum SeedlessRegistrationResult {
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  APPROVED = 'APPROVED',
  ERROR = 'ERROR'
}

export async function approveSeedlessRegistration(
  oidcToken: string
): Promise<SeedlessRegistrationResult> {
  // Extract user identity from token
  const payload = JSON.parse(
    Buffer.from(oidcToken.split('.')?.[1] ?? '', 'base64').toString('ascii')
  )
  const iss = payload.iss
  const sub = payload.sub
  const email = payload.email

  return fetch(Config.SEEDLESS_URL + '/v1/register', {
    method: 'POST',
    body: JSON.stringify({
      iss,
      sub,
      email
    }),
    headers: {
      Authorization: `${Config.SEEDLESS_API_AUTHORIZATION_TOKEN}`
    }
  })
    .then(async response => {
      if ((await response.text()) === 'USER_ALREADY_EXISTS') {
        return SeedlessRegistrationResult.ALREADY_REGISTERED
      }
      return SeedlessRegistrationResult.APPROVED
    })
    .catch(() => {
      return SeedlessRegistrationResult.ERROR
    })
}
