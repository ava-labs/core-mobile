import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Dimensions, Linking, Pressable, StyleSheet } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import BridgeToggleIcon from 'assets/icons/BridgeToggleIcon.svg'
import DropDown from 'components/Dropdown'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import {
  BIG_ZERO,
  formatTokenAmount,
  useBridgeSDK,
  useTokenInfoContext,
  WrapStatus
} from '@avalabs/core-bridge-sdk'
import AppNavigation from 'navigation/AppNavigation'
import CarrotSVG from 'components/svg/CarrotSVG'
import useBridge from 'screens/bridge/hooks/useBridge'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BridgeScreenProps } from 'navigation/types'
import { setActive } from 'store/network'
import {
  bigintToBig,
  bigToBigInt,
  bigToLocaleString,
  resolve
} from '@avalabs/core-utils-sdk'
import Big from 'big.js'
import { ActivityIndicator } from 'components/ActivityIndicator'
import Logger from 'utils/Logger'
import { isUnifiedBridgeAsset } from 'screens/bridge/utils/bridgeUtils'
import { BNInput } from 'components/BNInput'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Button, Text, View, useTheme, ScrollView } from '@avalabs/k2-mobile'
import CircleLogo from 'assets/icons/circle_logo.svg'
import { Tooltip } from 'components/Tooltip'
import { DOCS_BRIDGE_FAQS } from 'resources/Constants'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectAvailableNativeTokenBalanceForNetworkAndAccount } from 'store/balance/slice'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account/slice'
import { Audios, audioFeedback } from 'utils/AudioFeedback'
import { showTransactionErrorToast } from 'utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { Network } from '@avalabs/core-chains-sdk'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { AssetBalance, BridgeProvider } from './utils/types'

const blockchainTitleMaxWidth = Dimensions.get('window').width * 0.5
const dropdownWidth = Dimensions.get('window').width * 0.6

const TRANSFER_ERROR = 'There was a problem with the transfer.'

const NO_AMOUNT = '-'

const formatBalance = (balance: Big | undefined): string | undefined => {
  return balance && formatTokenAmount(balance, 6)
}

type NavigationProps = BridgeScreenProps<typeof AppNavigation.Bridge.Bridge>

const BridgeUniversal: FC = () => {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { params } = useRoute<NavigationProps['route']>()
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { activeNetwork } = useNetworks()

  const selectedCurrency = useSelector(selectSelectedCurrency)
  const {
    sourceBalance,
    amount,
    setAmount,
    assetsWithBalances,
    networkFee,
    loading,
    price,
    maximum,
    minimum,
    receiveAmount,
    wrapStatus,
    transfer,
    bridgeFee,
    provider,
    denomination,
    amountBN,
    sourceNetworks,
    targetNetworks,
    sourceNetwork,
    setSourceNetwork,
    targetNetwork,
    setTargetNetwork,
    bridgeAssets,
    selectedBridgeAsset,
    setSelectedBridgeAsset,
    error
  } = useBridge()

  const { setCurrentAsset: setCurrentAssetSymbol } = useBridgeSDK()
  const activeAccount = useSelector(selectActiveAccount)
  const [bridgeError, setBridgeError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const tokenInfoData = useTokenInfoContext()
  const nativeTokenBalance = useSelector((state: RootState) =>
    selectAvailableNativeTokenBalanceForNetworkAndAccount(
      state,
      activeNetwork.chainId,
      activeAccount?.index
    )
  )
  const selectedAssetSymbol = selectedBridgeAsset?.symbol

  const { currencyFormatter } = useApplicationContext().appHook
  const isAmountTooLow =
    amount && !amount.eq(BIG_ZERO) && minimum && amount.lt(minimum)

  const isAmountTooLarge =
    amount && !amount.eq(BIG_ZERO) && maximum && amount.gt(maximum)

  const isNativeBalanceNotEnoughForNetworkFee = Boolean(
    amount &&
      !amount.eq(BIG_ZERO) &&
      networkFee &&
      bigintToBig(nativeTokenBalance, activeNetwork.networkToken.decimals).lt(
        networkFee
      )
  )

  const hasValidAmount = !isAmountTooLow && amount.gt(BIG_ZERO)

  const hasInvalidReceiveAmount =
    hasValidAmount && !!receiveAmount && receiveAmount.eq(BIG_ZERO)

  const formattedAmountCurrency =
    hasValidAmount && price
      ? currencyFormatter(price.mul(amount).toNumber())
      : NO_AMOUNT

  const formattedReceiveAmount =
    hasValidAmount && receiveAmount
      ? bigToLocaleString(receiveAmount)
      : NO_AMOUNT
  const formattedReceiveAmountCurrency =
    hasValidAmount && price && receiveAmount
      ? currencyFormatter(price.mul(receiveAmount).toNumber())
      : NO_AMOUNT

  const transferDisabled =
    loading ||
    isPending ||
    isAmountTooLow ||
    isAmountTooLarge ||
    isNativeBalanceNotEnoughForNetworkFee ||
    BIG_ZERO.eq(amount) ||
    hasInvalidReceiveAmount

  // Update selected asset for unified bridge whenever currentBlockchain changes
  // useEffect(() => {
  //   if (!selectedBridgeAsset) return

  //   const correspondingAsset = assetsWithBalances?.find(asset => {
  //     // when selected asset is USDC.e and we are switching to Ethereum
  //     // we want to automatically select USDC
  //     // to do that, we need to compare by symbol (USDC) instead of symbolOnNetwork (USDC.e)
  //     if (
  //       currentBlockchain === Blockchain.ETHEREUM &&
  //       selectedBridgeAsset.symbolOnNetwork === 'USDC.e'
  //     ) {
  //       return asset.symbol === selectedBridgeAsset.symbol
  //     }

  //     // for all other cases we just simply compare the real symbol on network
  //     return asset.symbolOnNetwork === selectedBridgeAsset.symbolOnNetwork
  //   })

  //   // if the found asset is not in the list of new assets with balances, clear the selection
  //   if (!correspondingAsset) {
  //     setSelectedBridgeAsset(undefined)
  //     return
  //   }

  //   // if the found asset is a unified bridge asset and its value is different, set it as the current asset
  //   if (
  //     isUnifiedBridgeAsset(correspondingAsset.asset) &&
  //     JSON.stringify(correspondingAsset.asset) !==
  //       JSON.stringify(selectedAsset.asset)
  //   ) {
  //     setSelectedAsset(correspondingAsset)
  //   }
  // }, [assetsWithBalances, currentBlockchain, selectedAsset])

  useEffect(() => {
    setSourceNetwork(activeNetwork)
  }, [activeNetwork, setSourceNetwork])

  useEffect(() => {
    if (!sourceNetwork) return

    dispatch(setActive(sourceNetwork.chainId))
    // Reset because a denomination change will change its value
    setAmount(undefined)
  }, [sourceNetwork, dispatch, setAmount])

  const handleSelect = useCallback(
    (token: AssetBalance): void => {
      if (!isUnifiedBridgeAsset(token.asset)) {
        return
      }

      const symbol = token.symbol

      setCurrentAssetSymbol(symbol)
      setSelectedBridgeAsset(token.asset)
    },
    [setCurrentAssetSymbol, setSelectedBridgeAsset]
  )

  useEffect(() => {
    if (params?.initialTokenSymbol && !selectedBridgeAsset) {
      const token = assetsWithBalances?.find(
        tk => (tk.symbolOnNetwork ?? tk.symbol) === params.initialTokenSymbol
      )
      if (token) {
        handleSelect(token)
      }
    }
  }, [params, assetsWithBalances, handleSelect, selectedBridgeAsset])

  useEffect(() => {
    if (error) {
      setBridgeError(error.message)
    }
  }, [error])

  const bridgeTokenList = useMemo(
    () =>
      (assetsWithBalances ?? []).filter(asset =>
        bridgeAssets
          .map(bridgeAsset => bridgeAsset.symbol)
          .includes(asset.symbolOnNetwork ?? asset.asset.symbol)
      ),
    [assetsWithBalances, bridgeAssets]
  )

  /**
   * Opens token selection modal
   */
  const navigateToTokenSelector = (): void => {
    navigation.navigate(AppNavigation.Modal.BridgeSelectToken, {
      onTokenSelected: handleSelect,
      bridgeTokenList
    })
  }

  const handleAmountChanged = useCallback(
    (value: { bn: bigint; amount: string }) => {
      const bigValue = bigintToBig(value.bn, denomination)
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

  const [previousConfig, setPreviousConfig] = useState<{
    sourceNetwork: Network
    bridgeAsset: BridgeAsset | undefined
  }>()

  useEffect(() => {
    if (previousConfig) {
      const oldChainId = previousConfig.sourceNetwork.chainId

      if (
        targetNetworks.findIndex(network => network.chainId === oldChainId) !==
        -1
      ) {
        setTargetNetwork(previousConfig.sourceNetwork)
        if (previousConfig.bridgeAsset) {
          const bridgeAssetSymbol = previousConfig.bridgeAsset.symbol
          const bridgeAsset = bridgeAssets.find(
            asset => asset.symbol === bridgeAssetSymbol
          )
          if (bridgeAsset) {
            setSelectedBridgeAsset(bridgeAsset)
          }
        }
        setPreviousConfig(undefined)
        setAmount(undefined)
      }
    }
  }, [
    sourceNetwork,
    previousConfig,
    targetNetworks,
    setTargetNetwork,
    setSelectedBridgeAsset,
    bridgeAssets,
    setAmount
  ])

  const handleNetworkToggle = (): void => {
    if (targetNetwork && sourceNetwork) {
      setPreviousConfig({
        sourceNetwork: sourceNetwork,
        bridgeAsset: selectedBridgeAsset
      })
      setSourceNetwork(targetNetwork)
    }
  }

  /**
   * Handles transfer transaction
   */
  const handleTransfer = async (): Promise<void> => {
    if (BIG_ZERO.eq(amount) || !sourceNetwork || !targetNetwork) {
      return
    }

    AnalyticsService.capture('BridgeTransferStarted', {
      sourceBlockchain: sourceNetwork.chainName,
      targetBlockchain: targetNetwork.chainName
    })

    try {
      setIsPending(true)
      const [hash, transferError] = await resolve(transfer())
      setIsPending(false)

      if (transferError || !hash) {
        // do not show the error when the user denied the transfer
        if (isUserRejectedError(transferError)) {
          Logger.error('failed to bridge', transferError)
          AnalyticsService.capture('BridgeTransferRequestUserRejectedError', {
            sourceBlockchain: sourceNetwork.chainName,
            targetBlockchain: targetNetwork.chainName,
            fee: bridgeFee.toNumber()
          })
          return
        }
        setBridgeError(TRANSFER_ERROR)
        showTransactionErrorToast({
          message: getJsonRpcErrorMessage(transferError)
        })
        Logger.error(TRANSFER_ERROR, transferError)
        AnalyticsService.capture('BridgeTransferRequestError', {
          sourceBlockchain: sourceNetwork.chainName,
          targetBlockchain: targetNetwork.chainName
        })
        return
      }

      audioFeedback(Audios.Send)

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

  const renderNetworkItem = (
    network: Network | undefined,
    textVariant: 'buttonLarge' | 'buttonMedium'
  ): JSX.Element => {
    return (
      <>
        <NetworkLogo logoUri={network?.logoUri} size={32} />
        <Space x={8} />
        <Text
          variant={textVariant}
          sx={{
            maxWidth: blockchainTitleMaxWidth,
            textAlign: 'right',
            color: '$neutral50'
          }}
          ellipsizeMode="tail">
          {network?.chainName}
        </Text>
      </>
    )
  }

  const renderNetwork = (network: Network | undefined): JSX.Element => {
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingLeft: 16,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
        {renderNetworkItem(network, 'buttonLarge')}
      </Row>
    )
  }

  const renderDropdownItem = (
    network: Network,
    selectedNetwork?: Network
  ): JSX.Element => {
    const isSelected = network.chainId === selectedNetwork?.chainId

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
          {renderNetworkItem(network, 'buttonMedium')}
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
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16
        }}>
        <Text variant={'heading6'}>From</Text>
        <View>
          <DropDown
            width={dropdownWidth}
            data={sourceNetworks}
            selectedIndex={sourceNetworks.findIndex(
              network => network.chainId === sourceNetwork?.chainId
            )}
            onItemSelected={setSourceNetwork}
            optionsRenderItem={item =>
              renderDropdownItem(item.item, sourceNetwork)
            }
            selectionRenderItem={() => renderNetwork(sourceNetwork)}
            style={{
              top: 22
            }}
            alignment="flex-end"
            prompt={
              <Text
                variant="buttonMedium"
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8,
                  fontWeight: '600'
                }}>
                Select Network
              </Text>
            }
          />
        </View>
      </Row>
    )
  }

  const renderBalance = (): JSX.Element => {
    const shouldRenderBalance = selectedBridgeAsset && sourceBalance?.balance

    return (
      <Text
        variant="caption"
        sx={{ color: '$neutral300', alignSelf: 'flex-end', paddingEnd: 16 }}>
        {`Balance: `}
        {shouldRenderBalance
          ? `${formatBalance(sourceBalance?.balance)}  ${selectedAssetSymbol}`
          : selectedBridgeAsset && <ActivityIndicator size={'small'} />}
      </Text>
    )
  }
  const renderTokenSelectInput = (): JSX.Element => (
    <Pressable disabled={loading} onPress={() => navigateToTokenSelector()}>
      <Row
        style={{
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        {selectedBridgeAsset && (
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
        <Text
          variant="buttonMedium"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
            fontWeight: '600'
          }}>
          {selectedBridgeAsset ? selectedAssetSymbol : 'Select Token'}
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
      bn: bigToBigInt(maximum, denomination),
      amount: bigToLocaleString(maximum, 4)
    })
  }, [denomination, handleAmountChanged, maximum])

  const renderAmountInput = (): JSX.Element => (
    <View>
      <>
        <BNInput
          value={amountBN}
          denomination={denomination}
          onMax={handleMax}
          placeholder={'0.0'}
          onChange={handleAmountChanged}
          textStyle={{ borderWidth: 0 }}
          inputTextContainerStyle={{
            minWidth: 160,
            maxWidth: 200,
            paddingRight: 8
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
      {!selectedBridgeAsset && (
        <Pressable
          disabled={loading}
          style={StyleSheet.absoluteFill}
          onPress={() => navigateToTokenSelector()}
        />
      )}
    </View>
  )

  const renderError = (): JSX.Element | null => {
    if (amount.eq(BIG_ZERO)) return null

    if (isAmountTooLow)
      return (
        <Text
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>
          {`Amount too low -- minimum is ${minimum?.toFixed(9)}`}
        </Text>
      )

    if (isAmountTooLarge)
      return (
        <Text
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>
          Insufficient balance
        </Text>
      )

    if (bridgeError)
      return (
        <Text
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>
          {bridgeError}
        </Text>
      )

    if (hasInvalidReceiveAmount)
      return (
        <Text
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>
          {`Receive amount can't be 0`}
        </Text>
      )

    if (isNativeBalanceNotEnoughForNetworkFee)
      return (
        <Text
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>{`Insufficient balance to cover gas costs.\nPlease add ${sourceNetwork?.networkToken.symbol}.`}</Text>
      )

    return null
  }

  const renderSelectSection = (): JSX.Element => {
    return (
      <View
        sx={{
          flex: 1,
          paddingStart: 16,
          paddingTop: 16,
          paddingBottom: 16
        }}>
        {renderBalance()}
        <Row
          style={{
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
          {renderTokenSelectInput()}
          {renderAmountInput()}
        </Row>

        <Row
          style={{
            justifyContent: 'space-between',
            paddingEnd: 16,
            marginBottom: 16,
            minHeight: 16
          }}>
          <View sx={{ flex: 1 }}>{renderError()}</View>

          {/* Amount in currency */}
          <View
            style={{
              alignItems: 'flex-end',
              width: '50%',
              marginLeft: 16
            }}>
            <Row>
              <Text
                variant="caption"
                sx={{ color: '$neutral300', marginRight: 4 }}
                numberOfLines={1}>
                {formattedAmountCurrency}
              </Text>
              {formattedAmountCurrency !== NO_AMOUNT && (
                <Text variant="caption" sx={{ color: '$neutral300' }}>
                  {selectedCurrency}
                </Text>
              )}
            </Row>
          </View>
        </Row>
      </View>
    )
  }

  const renderToggleBtn = (): JSX.Element => {
    return (
      <AvaButton.Base
        onPress={handleNetworkToggle}
        style={{
          alignSelf: 'center',
          marginTop: -20,
          borderRadius: 50,
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.$white
        }}>
        <BridgeToggleIcon color={theme.colors.$black} />
      </AvaButton.Base>
    )
  }

  const renderToSection = (): JSX.Element => {
    return (
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16
        }}>
        <Text variant={'heading6'}>To</Text>
        <View>
          {targetNetworks.length === 1 ? (
            renderNetwork(targetNetwork)
          ) : (
            <DropDown
              width={dropdownWidth}
              data={targetNetworks}
              selectedIndex={targetNetworks.findIndex(
                network => network.chainId === targetNetwork?.chainId
              )}
              onItemSelected={setTargetNetwork}
              optionsRenderItem={item =>
                renderDropdownItem(item.item, targetNetwork)
              }
              selectionRenderItem={() => renderNetwork(targetNetwork)}
              style={{
                top: 22
              }}
              alignment="flex-end"
              prompt={
                <Text
                  variant="buttonMedium"
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                    fontWeight: '600'
                  }}>
                  Select Network
                </Text>
              }
            />
          )}
        </View>
      </Row>
    )
  }

  const renderReceiveSection = (): JSX.Element => {
    return (
      <Row
        style={{
          flex: 1,
          padding: 16,
          justifyContent: 'space-between'
        }}>
        <View>
          <Text variant="buttonLarge">Receive</Text>
          <Text variant="caption" sx={{ marginTop: 4, color: '$neutral400' }}>
            Estimated (minus transfer fees)
          </Text>
        </View>
        <View
          style={{
            alignItems: 'flex-end',
            width: '40%'
          }}>
          {/* receive amount */}
          <Row>
            <Text variant="body1" numberOfLines={1} sx={{ marginRight: 4 }}>
              {formattedReceiveAmount}
            </Text>
            {formattedReceiveAmount !== NO_AMOUNT && (
              <Text variant="body1">{selectedAssetSymbol}</Text>
            )}
          </Row>
          {/* estimate amount */}
          <Row>
            <Text
              variant="caption"
              numberOfLines={1}
              sx={{ marginTop: 4, color: '$neutral400', marginRight: 4 }}>
              {formattedReceiveAmountCurrency}
            </Text>
            {formattedReceiveAmountCurrency !== NO_AMOUNT && (
              <Text
                variant="caption"
                numberOfLines={1}
                sx={{ marginTop: 4, color: '$neutral400' }}>
                {selectedCurrency}
              </Text>
            )}
          </Row>
        </View>
      </Row>
    )
  }

  const renderTransferBtn = (): JSX.Element => {
    return (
      <Button
        type="primary"
        size="xlarge"
        style={{ marginHorizontal: 16, marginBottom: 10, marginTop: 16 }}
        disabled={transferDisabled}
        onPress={() => {
          handleTransfer()
        }}>
        {isPending ? (
          <>
            <ActivityIndicator /> Bridging...
          </>
        ) : (
          'Bridge'
        )}
      </Button>
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
      <ScrollView
        sx={{
          flex: 1
        }}
        contentContainerSx={{
          marginHorizontal: 8
        }}>
        <Text variant="heading3" style={{ marginHorizontal: 8 }}>
          Bridge
        </Text>
        <Space y={40} />
        <View
          sx={{
            backgroundColor: '$neutral850',
            borderRadius: 10
          }}>
          <View
            sx={{
              backgroundColor: '$neutral900',
              borderRadius: 10
            }}>
            {renderFromSection()}
            <Separator inset={16} color={theme.colors.$neutral800} />
            {renderSelectSection()}
          </View>
          {renderToggleBtn()}
          <View>
            {renderToSection()}
            <Separator inset={16} color={theme.colors.$neutral800} />
            {renderReceiveSection()}
          </View>
        </View>
      </ScrollView>
      {wrapStatus === WrapStatus.WAITING_FOR_DEPOSIT && (
        <Text
          variant="body2"
          sx={{
            alignSelf: 'center',
            color: '$neutral300'
          }}>
          Waiting for deposit confirmation
        </Text>
      )}
      {renderTransferBtn()}
      {provider === BridgeProvider.UNIFIED && renderCircleBadge()}
    </SafeAreaProvider>
  )
}

export default BridgeUniversal
