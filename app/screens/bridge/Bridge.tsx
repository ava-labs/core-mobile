import React, { FC, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG'
import AvaListItem from 'components/AvaListItem'
import DropDown from 'components/Dropdown'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import {
  BIG_ZERO,
  Blockchain,
  formatTokenAmount,
  useBridgeSDK,
  useGetTokenSymbolOnNetwork,
  useTokenInfoContext,
  WrapStatus
} from '@avalabs/bridge-sdk'
import AppNavigation from 'navigation/AppNavigation'
import CarrotSVG from 'components/svg/CarrotSVG'
import InputText from 'components/InputText'
import useBridge from 'screens/bridge/hooks/useBridge'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BridgeScreenProps } from 'navigation/types'
import { usePosthogContext } from 'contexts/PosthogContext'
import { TokenSymbol } from 'store/network'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { bnToBig, numberToBN, resolve } from '@avalabs/utils-sdk'
import Big from 'big.js'

const formatBalance = (balance: Big | undefined) => {
  return balance && formatTokenAmount(balance, 6)
}

type NavigationProp = BridgeScreenProps<
  typeof AppNavigation.Bridge.Bridge
>['navigation']

const Bridge: FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const theme = useApplicationContext().theme

  const {
    sourceBalance,
    amount,
    setAmount,
    assetsWithBalances,
    hasEnoughForNetworkFee,
    loading,
    price,
    maximum,
    minimum,
    receiveAmount,
    wrapStatus,
    transfer
  } = useBridge()

  const {
    currentAsset,
    setCurrentAsset,
    currentBlockchain,
    setCurrentBlockchain,
    targetBlockchain
  } = useBridgeSDK()
  const { getTokenSymbolOnNetwork } = useGetTokenSymbolOnNetwork()
  const activeNetwork = useActiveNetwork()
  const isMainnet = !activeNetwork.isTestnet
  const [bridgeError, setBridgeError] = useState<string>('')
  const [isPending, setIsPending] = useState<boolean>(false)
  const tokenInfoData = useTokenInfoContext()
  const denomination = sourceBalance?.asset.denomination || 0
  const blockchainTokenSymbol = getTokenSymbolOnNetwork(
    currentAsset ?? '',
    currentBlockchain
  )
  const { bridgeBtcBlocked, bridgeEthBlocked } = usePosthogContext()
  const { currencyFormatter } = useApplicationContext().appHook

  const isAmountTooLow =
    amount && !amount.eq(BIG_ZERO) && amount.lt(minimum || BIG_ZERO)
  const hasValidAmount = !isAmountTooLow && amount.gt(BIG_ZERO)

  const formattedReceiveAmount =
    hasValidAmount && receiveAmount
      ? `~${receiveAmount.toFixed(9)} ${currentAsset}`
      : '-'
  const formattedReceiveAmountCurrency =
    hasValidAmount && price && receiveAmount
      ? `~${currencyFormatter(price.mul(receiveAmount).toNumber())}`
      : '-'

  // Remove chains turned off by the feature flags
  const filterChains = (chains: Blockchain[]) =>
    chains.filter(chain => {
      switch (chain) {
        case Blockchain.BITCOIN:
          // TODO remove !isMainnet check when mainnet is supported
          return !isMainnet && !bridgeBtcBlocked
        case Blockchain.ETHEREUM:
          return !bridgeEthBlocked
        default:
          return true
      }
    })

  useEffect(() => {
    setBridgeError(bridgeError)
  }, [bridgeError])

  /**
   * Used to display currently selected and dropdown items.
   * When used to render current item, showCheckmarks is false
   * When used to render dropdown items, showCheckmark is true
   * currently selected
   *
   * Added additional parameter 'selectedBlockchain' in preparation for Bitcoin'
   *
   * @param blockchain
   * @param selectedBlockchain
   * @param showCheckmark
   */
  function dropdownItemFormat(
    blockchain?: string,
    selectedBlockchain?: Blockchain,
    showCheckmark = true
  ) {
    const isSelected = showCheckmark && blockchain === selectedBlockchain
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingHorizontal: 8,
          alignItems: 'center'
        }}>
        <Avatar.Custom
          name={blockchain ?? ''}
          symbol={
            blockchain === Blockchain.AVALANCHE
              ? TokenSymbol.AVAX
              : blockchain === Blockchain.ETHEREUM
              ? TokenSymbol.ETH
              : blockchain === Blockchain.BITCOIN
              ? TokenSymbol.BTC
              : undefined
          }
        />
        <Space x={8} />
        <AvaText.Body1>{blockchain?.toUpperCase()}</AvaText.Body1>
        {isSelected && (
          <>
            <Space x={8} />
            <CheckmarkSVG color={'white'} />
          </>
        )}
      </Row>
    )
  }

  /**
   * Opens token selection modal
   */
  const navigateToTokenSelector = () => {
    navigation.navigate(AppNavigation.Modal.BridgeSelectToken, {
      onTokenSelected: handleSelect,
      bridgeTokenList: assetsWithBalances ?? []
    })
  }

  /**
   * Opens Add bitcoin instructions modal
   */
  const navigateToAddBitcoinInstructions = () => {
    navigation.navigate(AppNavigation.Bridge.AddInstructions)
  }

  /**
   * Blockchain array that's fed to dropdown
   */
  const sourceBlockchains = [
    Blockchain.AVALANCHE,
    Blockchain.BITCOIN,
    Blockchain.ETHEREUM
  ]

  const handleAmountChanged = (value: string) => {
    const bn = numberToBN(Number(value), denomination)
    try {
      setAmount(bnToBig(bn, denomination))
    } catch (e) {
      console.log(e)
    }
  }

  const handleBlockchainToggle = () => {
    if (targetBlockchain) {
      setCurrentBlockchain(targetBlockchain)
    }
  }

  const handleSelect = (symbol: string) => {
    setCurrentAsset(symbol)
  }

  /**
   * Handles transfer transaction
   */
  const handleTransfer = async () => {
    if (BIG_ZERO.eq(amount)) {
      return
    }

    try {
      setIsPending(true)
      const [hash, error] = await resolve(transfer())
      setIsPending(false)

      if (error || !hash) {
        console.error(error)
        setBridgeError('There was a problem with the transfer.')
        return
      }

      // Navigate to transaction status page
      navigation.navigate(AppNavigation.Bridge.BridgeTransactionStatus, {
        blockchain: currentBlockchain as string,
        txHash: hash ?? '',
        txTimestamp: Date.now().toString()
      })
    } catch (e: any) {
      Alert.alert(
        'Error Bridging',
        'reason' in e
          ? e?.reason
          : e?.message ??
              'An unknown error has occurred. Bridging was halted. Please try again later'
      )
      return
    } finally {
      setIsPending(false)
    }
  }

  const transferDisabled =
    bridgeError.length > 0 ||
    loading ||
    isPending ||
    isAmountTooLow ||
    BIG_ZERO.eq(amount) ||
    !hasEnoughForNetworkFee

  return (
    <SafeAreaProvider>
      <ScrollView style={styles.container}>
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 8 }}>
          Bridge
        </AvaText.LargeTitleBold>
        <Space y={20} />
        <View style={{ backgroundColor: theme.colorBg2, borderRadius: 10 }}>
          <AvaListItem.Base
            title={'From'}
            rightComponent={
              <DropDown
                data={filterChains(sourceBlockchains)}
                selectedIndex={sourceBlockchains.indexOf(currentBlockchain)}
                onItemSelected={bc => setCurrentBlockchain(bc as Blockchain)}
                optionsRenderItem={item =>
                  dropdownItemFormat(item.item, currentBlockchain)
                }
                selectionRenderItem={item =>
                  dropdownItemFormat(item, currentBlockchain, false)
                }
                width={180}
              />
            }
          />
          {currentBlockchain === Blockchain.BITCOIN && (
            <Row style={{ justifyContent: 'flex-end' }}>
              <AvaButton.Base
                style={{ marginEnd: 16, marginBottom: 8 }}
                onPress={navigateToAddBitcoinInstructions}>
                <AvaText.TextLink>Add Bitcoin</AvaText.TextLink>
              </AvaButton.Base>
            </Row>
          )}
          <Separator inset={16} />
          <View style={styles.fromContainer}>
            <AvaText.Body3
              color={theme.colorText2}
              textStyle={{
                alignSelf: 'flex-end',
                paddingEnd: 16
              }}>
              Balance:
              {sourceBalance?.balance
                ? ` ${formatBalance(sourceBalance?.balance)}`
                : !!currentAsset && <ActivityIndicator size={'small'} />}{' '}
              {blockchainTokenSymbol}
            </AvaText.Body3>
            <Row style={styles.tokenSelectContainer}>
              <Pressable
                disabled={loading}
                onPress={() => navigateToTokenSelector()}>
                <Row style={styles.tokenRow}>
                  {!!currentAsset && (
                    <>
                      <Avatar.Custom
                        name={blockchainTokenSymbol}
                        symbol={blockchainTokenSymbol}
                        logoUri={tokenInfoData?.[blockchainTokenSymbol]?.logo}
                      />
                      <Space x={8} />
                    </>
                  )}
                  <AvaText.Body1 textStyle={styles.tokenSelectorText}>
                    {currentAsset ? blockchainTokenSymbol : 'Select'}
                  </AvaText.Body1>
                  <CarrotSVG direction={'down'} size={12} />
                </Row>
              </Pressable>
              <View>
                <>
                  <InputText
                    width={160}
                    mode={'amount'}
                    keyboardType="numeric"
                    onMax={() => {
                      if (maximum) {
                        setAmount(maximum.round(6, 0))
                      }
                    }}
                    onChangeText={handleAmountChanged}
                    text={amount.toString()}
                  />
                  {loading && (
                    <ActivityIndicator
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: -12
                      }}
                      size="small"
                    />
                  )}
                </>
                {!currentAsset && (
                  <Pressable
                    disabled={loading}
                    style={StyleSheet.absoluteFill}
                    onPress={() => navigateToTokenSelector()}
                  />
                )}
              </View>
            </Row>
            {!amount.eq(BIG_ZERO) && (
              <AvaText.Body3
                currency
                color={theme.colorText2}
                textStyle={{
                  alignSelf: 'flex-end',
                  paddingEnd: 16
                }}>
                {`${price.mul(amount).toNumber()}`}
              </AvaText.Body3>
            )}
          </View>
        </View>

        {(!!bridgeError || isAmountTooLow || !hasEnoughForNetworkFee) && (
          <>
            {!hasEnoughForNetworkFee && (
              <AvaText.Body3
                textStyle={{ marginVertical: 4 }}
                color={theme.colorError}>
                {`Insufficient balance to cover gas costs.\nPlease add ${
                  currentBlockchain === Blockchain.AVALANCHE
                    ? TokenSymbol.AVAX
                    : TokenSymbol.ETH
                }.`}
              </AvaText.Body3>
            )}
            {isAmountTooLow && (
              <AvaText.Body3
                textStyle={{ marginVertical: 4 }}
                color={theme.colorError}>
                {`Amount too low -- minimum is ${minimum?.toFixed(9)}`}
              </AvaText.Body3>
            )}
            {!!bridgeError && (
              <AvaText.Body3
                textStyle={{ marginVertical: 4 }}
                color={theme.colorError}>
                {bridgeError}
              </AvaText.Body3>
            )}
          </>
        )}

        {wrapStatus === WrapStatus.WAITING_FOR_DEPOSIT && (
          <AvaText.Body3
            textStyle={{ marginVertical: 4 }}
            color={theme.colorError}>
            Waiting for deposit confirmation
          </AvaText.Body3>
        )}

        <AvaButton.Base
          onPress={handleBlockchainToggle}
          style={[styles.swapButton, { backgroundColor: theme.colorBg2 }]}>
          <SwapNarrowSVG />
        </AvaButton.Base>
        <View style={{ backgroundColor: theme.colorBg2, borderRadius: 10 }}>
          <AvaListItem.Base
            title={'To'}
            rightComponent={dropdownItemFormat(
              targetBlockchain,
              undefined,
              false
            )}
          />
          <Separator inset={16} />
          <Row style={styles.receiveRow}>
            <View>
              <AvaText.ButtonLarge>Receive</AvaText.ButtonLarge>
              <AvaText.Body3
                color={theme.colorText2}
                textStyle={{ marginTop: 8 }}>
                Estimated (minus transfer fees)
              </AvaText.Body3>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {/* receive amount */}
              <AvaText.Body1>{formattedReceiveAmount}</AvaText.Body1>
              {/* estimate amount */}
              <AvaText.Body3
                textStyle={{ marginTop: 8 }}
                color={theme.colorText2}>
                {formattedReceiveAmountCurrency}
              </AvaText.Body3>
            </View>
          </Row>
        </View>
      </ScrollView>
      <AvaButton.Base
        style={[
          styles.transferButton,
          { backgroundColor: transferDisabled ? '#FFFFFF80' : theme.white }
        ]}
        onPress={() => {
          handleTransfer()
        }}
        disabled={transferDisabled}>
        <Row>
          {isPending && <ActivityIndicator color={theme.background} />}
          <AvaText.ButtonLarge
            textStyle={{ color: theme.background, marginStart: 4 }}>
            Transfer
          </AvaText.ButtonLarge>
        </Row>
      </AvaButton.Base>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 8
  },
  fromContainer: {
    flex: 1,
    paddingStart: 16,
    paddingTop: 16,
    paddingBottom: 16
  },
  tokenSelectContainer: {
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tokenRow: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  tokenSelectorText: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  swapButton: {
    alignSelf: 'flex-end',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16
  },
  receiveRow: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between'
  },
  transferButton: {
    margin: 16,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 12
  }
})

export default Bridge
