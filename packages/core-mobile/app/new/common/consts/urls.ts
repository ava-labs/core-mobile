import Config from 'react-native-config'
import DeviceInfo from 'react-native-device-info'
import { Platform } from 'react-native'

const PRESELECTED_PLATFORM =
  Platform.OS === 'ios' ? 'Core+mobile+(iOS)' : 'Core+mobile+(Android)'

const VERSION = DeviceInfo.getReadableVersion()

export const moonpayURL = async (address: string): Promise<{ url: string }> => {
  return await fetch(`${Config.PROXY_URL}/moonpay/${address}`).then(response =>
    response.json()
  )
}

export const TERMS_OF_USE_URL = 'https://core.app/terms/core'

export const PRIVACY_POLICY_URL = 'https://www.avalabs.org/privacy-policy'

export const HELP_URL = 'https://support.core.app/en/'

export const BUG_REPORT_URL = `https://docs.google.com/forms/d/e/1FAIpQLSdUQiVnJoqQ1g_6XTREpkSB5vxKKK8ba5DRjhzQf1XVeET8Rw/viewform?usp=pp_url&entry.2070152111=${PRESELECTED_PLATFORM}&entry.903657115=${VERSION}`

export const FEATURE_REQUEST_URL = `https://docs.google.com/forms/d/e/1FAIpQLSdQ9nOPPGjVPmrLXh3B9NR1NuXXUiW2fKW1ylrXpiW_vZB_hw/viewform?entry.2070152111=${PRESELECTED_PLATFORM}`
