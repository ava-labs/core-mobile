import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Dimensions, Linking, Pressable, StyleSheet } from 'react-native'
import { Space } from 'components/Space'
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
  isUnifiedBridgeAsset,
  networkToBlockchain
} from 'screens/bridge/utils/bridgeUtils'
import { BNInput } from 'components/BNInput'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'
import { selectBridgeCriticalConfig } from 'store/bridge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import CircleLogo from 'assets/icons/circle_logo.svg'
import { Tooltip } from 'components/Tooltip'
import { DOCS_BRIDGE_FAQS } from 'resources/Constants'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { AssetBalance, BridgeProvider } from './utils/types'

const blockchainTitleMaxWidth = Dimensions.get('window').width * 0.5
const dropdownWith = Dimensions.get('window').width * 0.6

const sourceBlockchains = [
  Blockchain.AVALANCHE,
  Blockchain.BITCOIN,
  Blockchain.ETHEREUM
]

const TRANSFER_ERROR = 'There was a problem with the transfer.'

const formatBalance = (balance: Big | undefined): string | undefined => {
  return balance && formatTokenAmount(balance, 6)
}

type NavigationProp = BridgeScreenProps<
  typeof AppNavigation.Bridge.Bridge
>['navigation']

const Bridge: FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const criticalConfig = useSelector(selectBridgeCriticalConfig)
  const [selectedAsset, setSelectedAsset] = useState<AssetBalance>()
  const selectedCurrency = useSelector(selectSelectedCurrency)
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
    bridgeFee,
    provider
  } = useBridge(selectedAsset)

  const {
    setCurrentAsset: setCurrentAssetSymbol,
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

  const denomination = useMemo(() => {
    if (!sourceBalance) {
      return 0
    }

    if (isUnifiedBridgeAsset(sourceBalance.asset)) {
      return sourceBalance.asset.decimals
    }

    return sourceBalance.asset.denomination
  }, [sourceBalance])

  const selectedAssetSymbol = useMemo(
    () =>
      isUnifiedBridgeAsset(selectedAsset?.asset)
        ? selectedAsset?.asset.symbol
        : getTokenSymbolOnNetwork(
            selectedAsset?.asset.symbol ?? '',
            currentBlockchain
          ),
    [currentBlockchain, getTokenSymbolOnNetwork, selectedAsset?.asset]
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
    ? `${currencyFormatter(price.mul(amount).toNumber())} ${selectedCurrency}`
    : '-'
  const formattedReceiveAmount =
    hasValidAmount && receiveAmount
      ? `${bigToLocaleString(receiveAmount)} ${selectedAssetSymbol}`
      : '-'
  const formattedReceiveAmountCurrency =
    hasValidAmount && price && receiveAmount
      ? `${currencyFormatter(
          price.mul(receiveAmount).toNumber()
        )} ${selectedCurrency}`
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

  // Update selected asset for unified bridge whenever currentBlockchain changes
  useEffect(() => {
    if (!selectedAsset) return

    const correspondingAsset = assetsWithBalances?.find(asset => {
      // when selected asset is USDC.e and we are switching to Ethereum
      // we want to automatically select USDC
      // to do that, we need to compare by symbol (USDC) instead of symbolOnNetwork (USDC.e)
      if (
        currentBlockchain === Blockchain.ETHEREUM &&
        selectedAsset.symbolOnNetwork === 'USDC.e'
      ) {
        return asset.symbol === selectedAsset.symbol
      }

      // for all other cases we just simply compare the real symbol on network
      return asset.symbolOnNetwork === selectedAsset.symbolOnNetwork
    })

    // if the found asset is not in the list of new assets with balances, clear the selection
    if (!correspondingAsset) {
      setSelectedAsset(undefined)
      return
    }

    // if the found asset is a unified bridge asset and its value is different, set it as the current asset
    if (
      isUnifiedBridgeAsset(correspondingAsset.asset) &&
      JSON.stringify(correspondingAsset.asset) !==
        JSON.stringify(selectedAsset.asset)
    ) {
      setSelectedAsset(correspondingAsset)
    }
  }, [assetsWithBalances, currentBlockchain, selectedAsset])

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
  const navigateToTokenSelector = (): void => {
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

  const setCurrentBlockchain = (blockchain: Blockchain): void => {
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

  const handleBlockchainToggle = (): void => {
    if (targetBlockchain) {
      setCurrentBlockchain(targetBlockchain)
    }
  }

  const handleSelect = (token: AssetBalance): void => {
    const symbol = token.symbol

    setCurrentAssetSymbol(symbol)
    setSelectedAsset(token)
  }

  /**
   * Handles transfer transaction
   */
  const handleTransfer = async (): Promise<void> => {
    if (BIG_ZERO.eq(amount)) {
      return
    }

    AnalyticsService.capture('BridgeTransferStarted', {
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
          AnalyticsService.capture('BridgeTransferRequestUserRejectedError', {
            sourceBlockchain: currentBlockchain,
            targetBlockchain,
            fee: bridgeFee?.toNumber()
          })
          return
        }
        setBridgeError(TRANSFER_ERROR)
        Logger.error(TRANSFER_ERROR, error)
        AnalyticsService.capture('BridgeTransferRequestError', {
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
      AnalyticsService.capture('BridgeTokenSelectError', {
        errorMessage
      })
      return
    } finally {
      setIsPending(false)
    }
  }

  const renderBlockchain = (
    blockchain: Blockchain,
    textVariant: 'buttonLarge' | 'buttonMedium'
  ): JSX.Element => {
    const blockchainTitle = getBlockchainDisplayName(blockchain)

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
          variant={textVariant}
          sx={{
            maxWidth: blockchainTitleMaxWidth,
            textAlign: 'right',
            color: theme.colors.$neutral50
          }}
          ellipsizeMode="tail">
          {blockchainTitle}
        </Text>
      </>
    )
  }

  const renderToBlockchain = (blockchain: Blockchain): JSX.Element => {
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingLeft: 16,
          alignItems: 'center',
          justifyContent: 'flex-end',
          flex: 0
        }}>
        {renderBlockchain(blockchain, 'buttonLarge')}
      </Row>
    )
  }

  const renderFromBlockchain = (blockchain: Blockchain): JSX.Element => {
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingLeft: 16,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
        {renderBlockchain(blockchain, 'buttonLarge')}
      </Row>
    )
  }

  const renderDropdownItem = (
    blockchain: Blockchain,
    selectedBlockchain?: Blockchain
  ): JSX.Element => {
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
          {renderBlockchain(blockchain, 'buttonMedium')}
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

  const renderFromSection = (): JSX.Element => {
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

  const renderBalance = (): JSX.Element => {
    const shouldRenderBalance = selectedAsset && sourceBalance?.balance

    return (
      <Text
        variant="caption"
        sx={{ color: '$neutral300', alignSelf: 'flex-end', paddingEnd: 16 }}>
        Balance:
        {shouldRenderBalance
          ? ` ${formatBalance(sourceBalance?.balance)}`
          : selectedAsset && <ActivityIndicator size={'small'} />}
        {' ' + selectedAssetSymbol}
      </Text>
    )
  }
  const renderTokenSelectInput = (): JSX.Element => (
    <Pressable disabled={loading} onPress={() => navigateToTokenSelector()}>
      <Row style={styles.tokenRow}>
        {selectedAsset && (
          <>
            <Avatar.Custom
              name={selectedAssetSymbol ?? ''}
              symbol={selectedAssetSymbol}
              logoUri={
                selectedAssetSymbol &&
                tokenInfoData?.[selectedAssetSymbol]?.logo
              }
            />
            <Space x={8} />
          </>
        )}
        <Text variant="buttonMedium" style={styles.tokenSelectorText}>
          {selectedAsset ? selectedAssetSymbol : 'Select Token'}
        </Text>
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

  const renderAmountInput = (): JSX.Element => (
    <View>
      <>
        <BNInput
          value={!sourceBalance ? undefined : amountBN}
          denomination={denomination}
          onMax={handleMax}
          placeholder={'0.0'}
          onChange={handleAmountChanged}
          textStyle={{ borderWidth: 0 }}
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
      {!selectedAsset && (
        <Pressable
          disabled={loading}
          style={StyleSheet.absoluteFill}
          onPress={() => navigateToTokenSelector()}
        />
      )}
    </View>
  )

  const renderError = (): JSX.Element | false => {
    return (
      (!!bridgeError || isAmountTooLow || !hasEnoughForNetworkFee) && (
        <>
          {!hasEnoughForNetworkFee && (
            <Text
              variant="caption"
              sx={{
                color: '$dangerDark'
              }}>{`Insufficient balance to cover gas costs.\nPlease add ${
              currentBlockchain === Blockchain.AVALANCHE
                ? TokenSymbol.AVAX
                : TokenSymbol.ETH
            }.`}</Text>
          )}
          {isAmountTooLow && (
            <Text
              variant="caption"
              sx={{
                color: '$dangerDark'
              }}>
              {`Amount too low -- minimum is ${minimum?.toFixed(9)}`}
            </Text>
          )}
          {!!bridgeError && (
            <Text
              variant="caption"
              sx={{
                color: '$dangerDark'
              }}>
              {bridgeError}
            </Text>
          )}
        </>
      )
    )
  }

  const renderSelectSection = (): JSX.Element => {
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
              <Text
                variant="caption"
                sx={{
                  color: '$dangerDark'
                }}>
                Waiting for deposit confirmation
              </Text>
            )}
          </View>

          {/* Amount in currency */}
          <Text variant="caption" sx={{ color: '$neutral300' }}>
            {formattedAmountCurrency}
          </Text>
        </Row>
      </View>
    )
  }

  const renderToggleBtn = (): JSX.Element => {
    return (
      <AvaButton.Base
        onPress={handleBlockchainToggle}
        style={[styles.toggleButton, { backgroundColor: theme.colors.$white }]}>
        <BridgeToggleIcon color={theme.colors.$black} />
      </AvaButton.Base>
    )
  }

  const renderToSection = (): JSX.Element => {
    return (
      <View>
        <AvaListItem.Base
          title={'To'}
          rightComponentMaxWidth={'auto'}
          rightComponent={renderToBlockchain(targetBlockchain)}
        />
        <Separator inset={16} color={theme.colors.$neutral800} />
        <Row style={styles.receiveRow}>
          <View>
            <Text variant="buttonLarge">Receive</Text>
            <Text variant="caption" sx={{ marginTop: 4, color: '$neutral400' }}>
              Estimated (minus transfer fees)
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {/* receive amount */}
            <Text variant="body1">{formattedReceiveAmount}</Text>
            {/* estimate amount */}
            <Text variant="caption" sx={{ marginTop: 4, color: '$neutral400' }}>
              {formattedReceiveAmountCurrency}
            </Text>
          </View>
        </Row>
      </View>
    )
  }

  const renderTransferBtn = (): JSX.Element => {
    return (
      <>
        <Button
          type="primary"
          size="xlarge"
          style={{ marginHorizontal: 16, marginBottom: 10 }}
          disabled={transferDisabled}
          onPress={() => {
            handleTransfer()
          }}>
          {isPending ? (
            <>
              <ActivityIndicator /> Transferring...
            </>
          ) : (
            'Transfer'
          )}
        </Button>
      </>
    )
  }

  const handleBridgeFaqs = (): void => {
    Linking.openURL(DOCS_BRIDGE_FAQS).catch(e => {
      Logger.error(DOCS_BRIDGE_FAQS, e)
    })
  }

  const renderCCTPPopoverInfoText = (): JSX.Element => (
    <View
      sx={{
        backgroundColor: '$neutral100',
        marginHorizontal: 8,
        marginVertical: 4
      }}>
      <Text
        variant="buttonSmall"
        sx={{ color: '$neutral900', fontWeight: '400' }}>
        USDC is routed through Circle's Cross-Chain Transfer Protocol.
      </Text>
      <Text
        variant="buttonSmall"
        onPress={handleBridgeFaqs}
        sx={{ color: '$blueDark' }}>
        Bridge FAQs
      </Text>
    </View>
  )

  const renderCircleBadge = (): JSX.Element => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          marginBottom: 10
        }}>
        <Text variant="caption">Powered by </Text>
        <CircleLogo width={50} height={'100%'} style={{ marginTop: 1 }} />
        <Tooltip
          iconColor={theme.colors.$neutral50}
          content={renderCCTPPopoverInfoText()}
          position="top"
          style={{
            width: 200
          }}
        />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <ScrollViewList style={styles.container}>
        <Text variant="heading3" style={{ marginHorizontal: 8 }}>
          Bridge
        </Text>
        <Space y={40} />
        <View
          style={{
            backgroundColor: theme.colors.$neutral850,
            borderRadius: 10
          }}>
          <View
            style={{
              backgroundColor: theme.colors.$neutral900,
              borderRadius: 10
            }}>
            {renderFromSection()}
            <Separator inset={16} color={theme.colors.$neutral800} />
            {renderSelectSection()}
          </View>
          {renderToggleBtn()}
          {renderToSection()}
        </View>
      </ScrollViewList>
      {renderTransferBtn()}
      {provider === BridgeProvider.UNIFIED && renderCircleBadge()}
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
    marginRight: 8,
    fontWeight: '600'
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
  }
})

export default React.memo(Bridge)
// Bridge.whyDidYouRender = true
