import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import WalletService from 'services/wallet/WalletService'

const VerifyPinForPrivateKeyScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const { walletId, accountIndex } = useLocalSearchParams<{
    walletId: string
    accountIndex: string
  }>()
  const activeNetwork = useSelector(selectActiveNetwork)

  const getPrivateKeyFromMnemonic = async (
    mnemonic: string
  ): Promise<string> => {
    return WalletService.getPrivateKeyFromMnemonic(
      mnemonic,
      activeNetwork,
      parseInt(accountIndex)
    )
  }

  const handleLoginSuccess = async (): Promise<void> => {
    const walletSecretResult = await BiometricsSDK.loadWalletSecret(walletId)
    if (!walletSecretResult.success) {
      Logger.error('Failed to load wallet secret', walletSecretResult.error)
      return
    }
    const walletSecret = walletSecretResult.value
    Logger.info('walletSecret', walletSecret)
    if (walletSecret.startsWith('0x')) {
      replace({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/viewPrivateKey',
        params: { privateKey: walletSecret }
      })
    } else {
      getPrivateKeyFromMnemonic(walletSecret)
        .then(privateKey => {
          replace({
            // @ts-ignore TODO: make routes typesafe
            pathname: '/accountSettings/viewPrivateKey',
            params: { privateKey }
          })
        })
        .catch(error => {
          Logger.error('Error getting private key from mnemonic', error)
        })
    }
  }

  return <VerifyWithPinOrBiometry onVerifySuccess={handleLoginSuccess} />
}

export default VerifyPinForPrivateKeyScreen
