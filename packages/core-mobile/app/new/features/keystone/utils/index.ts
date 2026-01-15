import { router } from 'expo-router'
import {
  keystoneParamsCache,
  KeystoneSignerParams,
  KeystoneTroubleshootingParams
} from '../services/keystoneParamsCache'

export const showKeystoneTroubleshooting = (
  params: KeystoneTroubleshootingParams
): void => {
  keystoneParamsCache.keystoneTroubleshootingParams.set(params)

  router.navigate({
    // @ts-ignore
    pathname: '/keystoneTroubleshooting'
  })
}

export const requestKeystoneSigner = (params: KeystoneSignerParams): void => {
  keystoneParamsCache.keystoneSignerParams.set(params)

  router.navigate({
    // @ts-ignore
    pathname: '/keystoneSigner'
  })
}
