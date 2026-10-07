import Config from 'react-native-config'

export const moonpayURL = async (address: string): Promise<{ url: string }> => {
  return await fetch(`${Config.PROXY_URL}/moonpay/${address}`).then(response =>
    response.json()
  )
}

export const TERMS_OF_USE_URL = 'https://core.app/terms/core'

export const PRIVACY_POLICY_URL = 'https://www.avalabs.org/privacy-policy'

export const HELP_URL = 'https://support.core.app/en/'

// Help-center article explaining perpetual futures (and regional availability).
// Note: not yet published at time of writing (CP-14520).
export const PERPS_HELP_URL =
  'https://support.core.app/en/articles/core-mobile-what-are-perpetual-futures'
