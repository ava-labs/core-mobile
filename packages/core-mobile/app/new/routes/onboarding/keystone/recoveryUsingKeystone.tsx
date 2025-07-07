import React from 'react'
import { useRouter } from 'expo-router'
import KeytoneSDK, { UR } from '@keystonehq/keystone-sdk'
import { RecoveryUsingKeystone as Component } from 'features/onboarding/components/RecoveryUsingKeystone'
import Logger from 'utils/Logger'
import { fromPublicKey } from 'bip32'
import KeystoneService from 'hardware/services/KeystoneService'

export default function RecoveryUsingKeystone(): JSX.Element {
  const { navigate, replace } = useRouter()

  function handleNext(ur: UR): void {
    try {
      const sdk = new KeytoneSDK()
      const accounts = sdk.parseMultiAccounts(ur)
      const mfp = accounts.masterFingerprint
      const ethAccount = accounts.keys.find(key => key.chain === 'ETH')
      const avaxAccount = accounts.keys.find(key => key.chain === 'AVAX')
      if (!ethAccount || !avaxAccount) {
        throw new Error('No ETH or AVAX account found')
      }

      KeystoneService.init({
        evm: fromPublicKey(
          Buffer.from(ethAccount.publicKey, 'hex'),
          Buffer.from(ethAccount.chainCode, 'hex')
        ).toBase58(),
        xp: fromPublicKey(
          Buffer.from(avaxAccount.publicKey, 'hex'),
          Buffer.from(avaxAccount.chainCode, 'hex')
        ).toBase58(),
        mfp
      })

      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/onboarding/keystone/createPin'
      })
    } catch (error: any) {
      Logger.error(error.message)
      throw new Error('Failed to parse UR')
    }
  }

  function handleError(): void {
    replace({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/keystone/keystoneTroubleshooting'
    })
  }

  return <Component onSuccess={handleNext} onError={handleError} />
}
