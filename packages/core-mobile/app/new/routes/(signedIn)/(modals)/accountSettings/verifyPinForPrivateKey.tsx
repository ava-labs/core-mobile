import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSelector } from 'react-redux'
import { MnemonicWallet } from 'services/wallet/MnemonicWallet'
import { selectActiveNetwork } from 'store/network'
import NetworkService from 'services/network/NetworkService'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import { useActiveWallet } from 'common/hooks/useActiveWallet'

const VerifyPinForPrivateKeyScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const { accountIndex } = useLocalSearchParams<{ accountIndex: string }>()
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeWallet = useActiveWallet()

  const getPrivateKeyFromMnemonic = async (
    mnemonic: string
  ): Promise<string> => {
    const wallet: MnemonicWallet = new MnemonicWallet(mnemonic)
    const provider = await NetworkService.getProviderForNetwork(activeNetwork)
    if (!(provider instanceof JsonRpcBatchInternal)) {
      throw new Error('Unable to get signing key: wrong provider obtained')
    }
    const buffer = await wallet.getSigningKey({
      accountIndex: parseInt(accountIndex),
      network: activeNetwork,
      provider
    })
    return '0x' + buffer.toString('hex')
  }

  const handleLoginSuccess = async (): Promise<void> => {
    const walletSecretResult = await BiometricsSDK.loadWalletSecret(
      activeWallet.id
    )
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
