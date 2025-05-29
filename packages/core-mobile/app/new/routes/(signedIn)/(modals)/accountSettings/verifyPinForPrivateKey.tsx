import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSelector } from 'react-redux'
import WalletFactory from 'services/wallet/WalletFactory'
import { MnemonicWallet } from 'services/wallet/MnemonicWallet'
import { selectActiveNetwork } from 'store/network'
import NetworkService from 'services/network/NetworkService'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'

const VerifyPinForPrivateKeyScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const { accountIndex } = useLocalSearchParams<{ accountIndex: string }>()
  const activeNetwork = useSelector(selectActiveNetwork)

  const getPrivateKeyFromMnemonic = async (
    mnemonic: string
  ): Promise<string> => {
    const wallet: MnemonicWallet = await WalletFactory.createMnemonicWallet(
      mnemonic
    )
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

  const handleLoginSuccess = (walletSecret: string): void => {
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

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}

export default VerifyPinForPrivateKeyScreen
