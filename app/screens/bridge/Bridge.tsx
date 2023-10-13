import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { DdRum } from '@datadog/mobile-react-native'
import { Alert, Dimensions, Pressable, StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import BridgeToggleIcon from 'assets/icons/BridgeToggleIcon.svg'
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
import useBridge from 'screens/bridge/hooks/useBridge'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BridgeScreenProps } from 'navigation/types'
import { usePosthogContext } from 'contexts/PosthogContext'
import {
  selectActiveNetwork,
  selectNetworks,
  setActive,
  TokenSymbol
} from 'store/network'
import {
  bigToBN,
  bigToLocaleString,
  bnToBig,
  resolve
} from '@avalabs/utils-sdk'
import Big from 'big.js'
import ScrollViewList from 'components/ScrollViewList'
import { ActivityIndicator } from 'components/ActivityIndicator'
import Logger from 'utils/Logger'
import {
  blockchainToNetwork,
  getBlockchainDisplayName,
  networkToBlockchain
} from 'screens/bridge/utils/bridgeUtils'
import { BNInput } from 'components/BNInput'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'
import { selectBridgeCriticalConfig } from 'store/bridge'
import { usePostCapture } from 'hooks/usePosthogCapture'

const blockchainTitleMaxWidth = Dimensions.get('window').width * 0.5
const dropdownWith = Dimensions.get('window').width * 0.6

const sourceBlockchains = [
  Blockchain.AVALANCHE,
  Blockchain.BITCOIN,
  Blockchain.ETHEREUM
]

const TRANSFER_ERROR = 'There was a problem with the transfer.'

const formatBalance = (balance: Big | undefined) => {
  return balance && formatTokenAmount(balance, 6)
}

type NavigationProp = BridgeScreenProps<
  typeof AppNavigation.Bridge.Bridge
>['navigation']

const Bridge: FC = () => {
  useEffect(() => {
    DdRum.startView('BridgeScreen', 'BridgeScreen', {}, Date.now())

    return () => {
      DdRum.stopView('BridgeScreen', {}, Date.now())
    }
  }, [])

  const navigation = useNavigation<NavigationProp>()
  const theme = useApplicationContext().theme
  const { capture } = usePostCapture()
  const dispatch = useDispatch()
  const criticalConfig = useSelector(selectBridgeCriticalConfig)

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
    transfer,
    bridgeFee
  } = useBridge()

  const {
    currentAsset,
    setCurrentAsset,
    currentBlockchain,
    setCurrentBlockchain: setCurrentBlockchainSDK,
    targetBlockchain
  } = useBridgeSDK()
  const { getTokenSymbolOnNetwork } = useGetTokenSymbolOnNetwork()
  const networks = useSelector(selectNetworks)
  const activeNetwork = useSelector(selectActiveNetwork)
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
  const amountBN = useMemo(
    () => bigToBN(amount, denomination),
    [amount, denomination]
  )

  const isAmountTooLow =
    amount && !amount.eq(BIG_ZERO) && amount.lt(minimum || BIG_ZERO)
  const hasValidAmount = !isAmountTooLow && amount.gt(BIG_ZERO)

  const formattedAmountCurrency = hasValidAmount
    ? `${currencyFormatter(price.mul(amount).toNumber())}`
    : '-'
  const formattedReceiveAmount =
    hasValidAmount && receiveAmount
      ? `~${receiveAmount.toFixed(9)} ${currentAsset}`
      : '-'
  const formattedReceiveAmountCurrency =
    hasValidAmount && price && receiveAmount
      ? `~${currencyFormatter(price.mul(receiveAmount).toNumber())}`
      : '-'

  const transferDisabled =
    bridgeError.length > 0 ||
    loading ||
    isPending ||
    isAmountTooLow ||
    BIG_ZERO.eq(amount) ||
    !hasEnoughForNetworkFee

  // Derive bridge Blockchain from active network
  useEffect(() => {
    const networkBlockchain = networkToBlockchain(activeNetwork)
    if (currentBlockchain !== networkBlockchain) {
      setCurrentBlockchainSDK(networkBlockchain)
    }
  }, [activeNetwork, currentBlockchain, setCurrentBlockchainSDK])

  // Remove chains turned off by the feature flags
  const filterChains = useCallback(
    (chains: Blockchain[]) =>
      chains.filter(chain => {
        switch (chain) {
          case Blockchain.BITCOIN:
            return !bridgeBtcBlocked
          case Blockchain.ETHEREUM:
            return !bridgeEthBlocked
          default:
            return true
        }
      }),
    [bridgeBtcBlocked, bridgeEthBlocked]
  )

  /**
   * Blockchain array that's fed to dropdown
   */
  const availableBlockchains = useMemo(
    () => filterChains(sourceBlockchains),
    [filterChains]
  )

  /**
   * Opens token selection modal
   */
  const navigateToTokenSelector = () => {
    navigation.navigate(AppNavigation.Modal.BridgeSelectToken, {
      onTokenSelected: handleSelect,
      bridgeTokenList: assetsWithBalances ?? []
    })
  }

  const handleAmountChanged = useCallback(
    (value: { bn: BN; amount: string }) => {
      const bigValue = bnToBig(value.bn, denomination)
      if (bridgeError) {
        setBridgeError('')
      }
      try {
        setAmount(bigValue)
      } catch (e) {
        Logger.error('failed to set amount', e)
      }
    },
    [bridgeError, denomination, setAmount]
  )

  const setCurrentBlockchain = (blockchain: Blockchain) => {
    // update network
    const blockChainNetwork = blockchainToNetwork(
      blockchain,
      networks,
      criticalConfig
    )
    blockChainNetwork && dispatch(setActive(blockChainNetwork.chainId))
    // Reset because a denomination change will change its value
    setAmount(BIG_ZERO)
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

    capture('BridgeTransferStarted', {
      sourceBlockchain: currentBlockchain,
      targetBlockchain
    })

    try {
      setIsPending(true)
      const [hash, error] = await resolve(transfer())
      setIsPending(false)

      if (error || !hash) {
        // do not show the error when the user denied the transfer
        if (error === 'User declined the transaction') {
          Logger.error(error)
          capture('BridgeTransferRequestUserRejectedError', {
            sourceBlockchain: currentBlockchain,
            targetBlockchain,
            fee: bridgeFee?.toNumber()
          })
          return
        }
        setBridgeError(TRANSFER_ERROR)
        Logger.error(TRANSFER_ERROR)
        capture('BridgeTransferRequestError', {
          sourceBlockchain: currentBlockchain,
          targetBlockchain
        })
        return
      }

      // Navigate to transaction status page
      navigation.navigate(AppNavigation.Bridge.BridgeTransactionStatus, {
        txHash: hash ?? ''
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage =
        'reason' in e
          ? e?.reason
          : e?.message ??
            'An unknown error has occurred. Bridging was halted. Please try again later'
      Alert.alert('Error Bridging', errorMessage)
      capture('BridgeTokenSelectError', {
        errorMessage
      })
      return
    } finally {
      setIsPending(false)
    }
  }

  const renderBlockchain = (
    blockchain: Blockchain,
    textSize: 'large' | 'medium'
  ) => {
    const blockchainTitle = getBlockchainDisplayName(blockchain)

    const Text =
      textSize === 'large' ? AvaText.ButtonLarge : AvaText.ButtonMedium

    const symbol =
      blockchain === Blockchain.AVALANCHE
        ? TokenSymbol.AVAX
        : blockchain === Blockchain.ETHEREUM
        ? TokenSymbol.ETH
        : blockchain === Blockchain.BITCOIN
        ? TokenSymbol.BTC
        : undefined

    return (
      <>
        <Avatar.Custom name={blockchain ?? ''} symbol={symbol} />
        <Space x={8} />
        <Text
          textStyle={{
            maxWidth: blockchainTitleMaxWidth,
            textAlign: 'right',
            color: theme.colorText1
          }}
          ellipsizeMode="tail">
          {blockchainTitle}
        </Text>
      </>
    )
  }

  const renderToBlockchain = (blockchain: Blockchain) => {
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingLeft: 16,
          alignItems: 'center',
          justifyContent: 'flex-end',
          flex: 0
        }}>
        {renderBlockchain(blockchain, 'large')}
      </Row>
    )
  }

  const renderFromBlockchain = (blockchain: Blockchain) => {
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingLeft: 16,
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
        {renderBlockchain(blockchain, 'large')}
      </Row>
    )
  }

  const renderDropdownItem = (
    blockchain: Blockchain,
    selectedBlockchain?: Blockchain
  ) => {
    const isSelected = blockchain === selectedBlockchain

    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <Row
          style={{
            alignItems: 'center',
            flex: 1
          }}>
          {renderBlockchain(blockchain, 'medium')}
        </Row>
        {isSelected && (
          <View
            style={{
              alignSelf: 'flex-end',
              flexDirection: 'row',
              alignItems: 'center',
              height: '100%'
            }}>
            <Space x={8} />
            <CheckmarkSVG color={'white'} />
          </View>
        )}
      </Row>
    )
  }

  const renderFromSection = () => {
    return (
      <>
        <AvaListItem.Base
          title={'From'}
          rightComponentMaxWidth="auto"
          rightComponent={
            <View>
              <DropDown
                width={dropdownWith}
                data={availableBlockchains}
                selectedIndex={availableBlockchains.indexOf(currentBlockchain)}
                onItemSelected={setCurrentBlockchain}
                optionsRenderItem={item =>
                  renderDropdownItem(item.item, currentBlockchain)
                }
                selectionRenderItem={() =>
                  renderFromBlockchain(currentBlockchain)
                }
                style={{
                  top: 22
                }}
              />
            </View>
          }
        />
      </>
    )
  }

  const renderBalance = () => {
    return (
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
    )
  }
  const renderTokenSelectInput = () => (
    <Pressable disabled={loading} onPress={() => navigateToTokenSelector()}>
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
        <AvaText.Heading3 textStyle={styles.tokenSelectorText}>
          {currentAsset ? blockchainTokenSymbol : 'Select Token'}
        </AvaText.Heading3>
        <CarrotSVG direction={'down'} size={12} />
      </Row>
    </Pressable>
  )

  const handleMax = useCallback(() => {
    if (!maximum) {
      return
    }
    handleAmountChanged({
      bn: bigToBN(maximum, denomination),
      amount: bigToLocaleString(maximum, 4)
    })
  }, [denomination, handleAmountChanged, maximum])

  const renderAmountInput = () => (
    <View>
      <>
        <BNInput
          value={!sourceBalance ? undefined : amountBN}
          denomination={denomination}
          onMax={handleMax}
          placeholder={'0.0'}
          onChange={handleAmountChanged}
          style={{
            minWidth: 160
          }}
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
  )

  const renderError = () => {
    return (
      (!!bridgeError || isAmountTooLow || !hasEnoughForNetworkFee) && (
        <>
          {!hasEnoughForNetworkFee && (
            <AvaText.Body3 color={theme.colorError}>
              {`Insufficient balance to cover gas costs.\nPlease add ${
                currentBlockchain === Blockchain.AVALANCHE
                  ? TokenSymbol.AVAX
                  : TokenSymbol.ETH
              }.`}
            </AvaText.Body3>
          )}
          {isAmountTooLow && (
            <AvaText.Body3 color={theme.colorError}>
              {`Amount too low -- minimum is ${minimum?.toFixed(9)}`}
            </AvaText.Body3>
          )}
          {!!bridgeError && (
            <AvaText.Body3 color={theme.colorError}>
              {bridgeError}
            </AvaText.Body3>
          )}
        </>
      )
    )
  }

  const renderSelectSection = () => {
    return (
      <View style={styles.fromContainer}>
        {renderBalance()}
        <Row style={styles.tokenSelectContainer}>
          {renderTokenSelectInput()}
          {renderAmountInput()}
        </Row>

        <Row style={styles.errorAndPriceRow}>
          <View style={styles.errorContainer}>
            {renderError()}

            {wrapStatus === WrapStatus.WAITING_FOR_DEPOSIT && (
              <AvaText.Body3 color={theme.colorError}>
                Waiting for deposit confirmation
              </AvaText.Body3>
            )}
          </View>

          {/* Amount in currency */}
          <AvaText.Body3 color={theme.colorText2}>
            {formattedAmountCurrency}
          </AvaText.Body3>
        </Row>
      </View>
    )
  }

  const renderToggleBtn = () => {
    return (
      <AvaButton.Base
        onPress={handleBlockchainToggle}
        style={[
          styles.toggleButton,
          { backgroundColor: theme.alternateBackground }
        ]}>
        <BridgeToggleIcon color={theme.background} />
      </AvaButton.Base>
    )
  }

  const renderToSection = () => {
    return (
      <View>
        <AvaListItem.Base
          title={'To'}
          rightComponentMaxWidth={'auto'}
          rightComponent={renderToBlockchain(targetBlockchain)}
        />
        <Separator inset={16} color="#666666" />
        <Row style={styles.receiveRow}>
          <View>
            <AvaText.ButtonLarge textStyle={{ color: theme.colorText1 }}>
              Receive
            </AvaText.ButtonLarge>
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
    )
  }

  const renderTransferBtn = () => {
    return (
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
          {isPending && <ActivityIndicator />}
          <AvaText.ButtonLarge
            textStyle={{ color: theme.background, marginStart: 4 }}>
            Transfer
          </AvaText.ButtonLarge>
        </Row>
      </AvaButton.Base>
    )
  }

  return (
    <SafeAreaProvider>
      <ScrollViewList style={styles.container}>
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 8 }}>
          Bridge
        </AvaText.LargeTitleBold>
        <Space y={20} />
        <View style={{ backgroundColor: '#333333', borderRadius: 10 }}>
          <View style={{ backgroundColor: theme.colorBg2, borderRadius: 10 }}>
            {renderFromSection()}
            <Separator inset={16} />
            {renderSelectSection()}
          </View>
          {renderToggleBtn()}
          {renderToSection()}
        </View>
      </ScrollViewList>
      {renderTransferBtn()}
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
  errorAndPriceRow: {
    justifyContent: 'space-between',
    paddingEnd: 16,
    marginBottom: 16,
    minHeight: 16
  },
  errorContainer: {
    flex: 1
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
  toggleButton: {
    alignSelf: 'center',
    marginTop: -20,
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
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

export default React.memo(Bridge)
