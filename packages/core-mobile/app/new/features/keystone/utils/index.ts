import { router } from 'expo-router'
import { KeystoneTroubleshootingParams } from 'services/walletconnectv2/walletConnectCache/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { KeystoneSignerParams } from 'services/walletconnectv2/walletConnectCache/types'

export const showKeystoneTroubleshooting = (
  params: KeystoneTroubleshootingParams
): void => {
  walletConnectCache.keystoneTroubleshootingParams.set(params)

  router.navigate({
    // @ts-ignore
    pathname: '/keystoneTroubleshooting'
  })
}

export const requestKeystoneSigner = (params: KeystoneSignerParams): void => {
  walletConnectCache.keystoneSignerParams.set(params)

  router.navigate({
    // @ts-ignore
    pathname: '/keystoneSigner'
  })
}
