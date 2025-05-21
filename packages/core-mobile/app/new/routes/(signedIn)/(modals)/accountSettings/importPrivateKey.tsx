import { useRouter } from 'expo-router'
import React, { useState, useEffect, useCallback } from 'react'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { View, Text, useTheme, ActivityIndicator } from '@avalabs/k2-alpine'
import { SimpleTextInput } from 'new/common/components/SimpleTextInput'
import { Button } from '@avalabs/k2-alpine'
import {
  getBtcAddressFromPubKey,
  getEvmAddressFromPubKey,
  getPublicKeyFromPrivateKey
} from '@avalabs/core-wallets-sdk'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import Logger from 'utils/Logger'
import { strip0x, truncateAddress } from '@avalabs/core-utils-sdk'
import { networks } from 'bitcoinjs-lib'
import { TokenLogo } from 'common/components/TokenLogo'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { ImportedAccount } from 'store/account/types'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import {
  fetchBalanceForAccount,
  selectBalanceStatus,
  selectBalanceTotalInCurrencyForAccount,
  QueryStatus,
  selectIsBalanceLoadedForAccount
} from 'store/balance'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { selectTokenVisibility } from 'store/portfolio'
import { importPrivateKeyAccountAndCreateWallet } from 'store/wallet/thunks'

interface DerivedAddress {
  address: string
  icon?: React.ReactNode
}

const ImportPrivateKeyScreen = (): JSX.Element => {
  const { back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const [privateKey, setPrivateKey] = useState('')
  const [showDerivedInfo, setShowDerivedInfo] = useState(false)
  const [derivedAddresses, setDerivedAddresses] = useState<DerivedAddress[]>([])
  const [tempAccountDetails, setTempAccountDetails] =
    useState<ImportedAccount | null>(null)
  const [totalBalanceDisplay, setTotalBalanceDisplay] = useState<string | null>(
    null
  )
  const [isAwaitingOurBalance, setIsAwaitingOurBalance] = useState(false)

  const activeNetwork = useSelector(selectActiveNetwork)
  const dispatch = useDispatch()
  const globalBalanceQueryStatus = useSelector(selectBalanceStatus)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const { formatCurrency } = useFormatCurrency()

  const accountIdForBalance = tempAccountDetails ? tempAccountDetails.id : ''
  const currentTempAccountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(accountIdForBalance, tokenVisibility)
  )
  const isOurBalanceDataLoadedInStore = useSelector(
    selectIsBalanceLoadedForAccount(accountIdForBalance)
  )

  const deriveAddresses = useCallback(async (): Promise<void> => {
    setDerivedAddresses([])
    setTempAccountDetails(null)
    setIsAwaitingOurBalance(false)

    try {
      const strippedPk = strip0x(privateKey)

      if (strippedPk.length === 64) {
        const publicKey = getPublicKeyFromPrivateKey(strippedPk)

        const addressC = getEvmAddressFromPubKey(publicKey)
        const addressBTC = getBtcAddressFromPubKey(
          publicKey,
          activeNetwork.isTestnet ? networks.testnet : networks.bitcoin
        )

        const newTempAccountData = {
          id: uuid(),
          name: 'Imported Key',
          type: CoreAccountType.IMPORTED,
          walletId: CORE_MOBILE_WALLET_ID,
          addressC,
          addressBTC,
          addressAVM: '',
          addressPVM: '',
          addressCoreEth: addressC,
          active: false,
          walletName: 'Imported Key Wallet'
        } as ImportedAccount
        setTempAccountDetails(newTempAccountData)

        setDerivedAddresses([
          {
            address: addressC,
            icon: <TokenLogo symbol="AVAX" />
          },
          {
            address: addressBTC,
            icon: <TokenLogo symbol="BTC" />
          }
        ])
      }
    } catch (error) {
      Logger.info('error deriving addresses:', error)
      setDerivedAddresses([])
      setTempAccountDetails(null)
    }
  }, [activeNetwork.isTestnet, privateKey])

  useEffect(() => {
    if (privateKey.trim() !== '') {
      deriveAddresses()
      setShowDerivedInfo(true)
    } else {
      setShowDerivedInfo(false)
      setDerivedAddresses([])
      setTempAccountDetails(null)
    }
  }, [privateKey, deriveAddresses])

  useEffect(() => {
    if (
      tempAccountDetails &&
      !isAwaitingOurBalance &&
      globalBalanceQueryStatus === QueryStatus.IDLE &&
      totalBalanceDisplay === null
    ) {
      Logger.info(
        'Dispatching fetchBalanceForAccount for temp account:',
        tempAccountDetails.id
      )
      setIsAwaitingOurBalance(true)
      dispatch(fetchBalanceForAccount({ account: tempAccountDetails }))
    } else if (
      tempAccountDetails &&
      !isAwaitingOurBalance &&
      globalBalanceQueryStatus !== QueryStatus.IDLE
    ) {
      Logger.info(
        'Global balance fetching busy, deferring fetch for temp account.'
      )
    }
  }, [
    tempAccountDetails,
    dispatch,
    isAwaitingOurBalance,
    globalBalanceQueryStatus,
    totalBalanceDisplay
  ])

  useEffect(() => {
    if (
      isAwaitingOurBalance &&
      (isOurBalanceDataLoadedInStore ||
        globalBalanceQueryStatus === QueryStatus.IDLE)
    ) {
      setIsAwaitingOurBalance(false)
      if (isOurBalanceDataLoadedInStore) {
        Logger.info('Balance data for our temp account ID confirmed in store.')
      } else {
        Logger.info(
          'Global balance query idle, fetch for temp account assumed complete/included.'
        )
      }
    }
  }, [
    isAwaitingOurBalance,
    isOurBalanceDataLoadedInStore,
    globalBalanceQueryStatus
  ])

  useEffect(() => {
    if (!tempAccountDetails) {
      setTotalBalanceDisplay(null)
      return
    }
    if (isAwaitingOurBalance && !isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay('(Fetching...)')
    } else if (isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay(
        formatCurrency({ amount: currentTempAccountBalance })
      )
    } else if (!isAwaitingOurBalance && !isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay('(No balance data)')
    } else {
      setTotalBalanceDisplay(null)
    }
  }, [
    tempAccountDetails,
    currentTempAccountBalance,
    isAwaitingOurBalance,
    isOurBalanceDataLoadedInStore,
    formatCurrency
  ])

  const handleImport = (): void => {
    if (tempAccountDetails) {
      dispatch(
        importPrivateKeyAccountAndCreateWallet({
          accountDetails: tempAccountDetails
        })
      )
    }
    back()
  }

  return (
    <ScrollScreen
      title="Import private key"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ flex: 1, justifyContent: 'space-between' }}>
        <View sx={{ gap: 24 }}>
          <SimpleTextInput
            value={privateKey}
            onChangeText={setPrivateKey}
            placeholder="Enter private key"
            autoFocus
            secureTextEntry={true}
          />

          {showDerivedInfo && (
            <View sx={{ gap: 16 }}>
              <View
                sx={{
                  backgroundColor: colors.$surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  gap: 12
                }}>
                {derivedAddresses.map((item, index) => (
                  <React.Fragment key={item.address}>
                    <View
                      sx={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}>
                      {item.icon}
                      <Text sx={{ color: colors.$textPrimary, fontSize: 16 }}>
                        {truncateAddress(item.address, 8)}
                      </Text>
                    </View>
                    {index < derivedAddresses.length - 1 && (
                      <View
                        sx={{
                          height: 1,
                          backgroundColor: colors.$borderPrimary,
                          marginVertical: 4
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {totalBalanceDisplay && (
                <View
                  sx={{
                    backgroundColor: colors.$surfaceSecondary,
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                  <Text
                    sx={{
                      color: colors.$textPrimary,
                      fontSize: 16,
                      fontWeight: 'bold'
                    }}>
                    Total balance
                  </Text>
                  {isAwaitingOurBalance && !isOurBalanceDataLoadedInStore ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text
                      sx={{
                        color: colors.$textPrimary,
                        fontSize: 16,
                        fontWeight: 'bold'
                      }}>
                      {totalBalanceDisplay}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        <Button
          type="primary"
          size="large"
          onPress={handleImport}
          disabled={privateKey.trim() === '' || isAwaitingOurBalance}>
          Import
        </Button>
      </View>
    </ScrollScreen>
  )
}

export default ImportPrivateKeyScreen
