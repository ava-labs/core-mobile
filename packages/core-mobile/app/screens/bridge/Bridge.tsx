import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Dimensions, Pressable, StyleSheet } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import BridgeToggleIcon from 'assets/icons/BridgeToggleIcon.svg'
import DropDown from 'components/Dropdown'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
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
  bigToLocaleString,
  resolve
} from '@avalabs/core-utils-sdk'
import Big from 'big.js'
import { ActivityIndicator } from 'components/ActivityIndicator'
import Logger from 'utils/Logger'
import {
  unwrapAssetSymbol,
  wrapAssetSymbol
} from 'screens/bridge/utils/bridgeUtils'
import { BNInput } from 'components/BNInput'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Button, Text, View, useTheme, ScrollView } from '@avalabs/k2-mobile'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectAvailableNativeTokenBalanceForNetworkAndAccount } from 'store/balance/slice'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account/slice'
import { Audios, audioFeedback } from 'utils/AudioFeedback'
import { showTransactionErrorToast } from 'utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { BridgeAsset, TokenType } from '@avalabs/bridge-unified'
import {
  selectIsHallidayBridgeBannerBlocked,
  selectIsGaslessBlocked
} from 'store/posthog'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import GaslessService from 'services/gasless/GaslessService'
import { AssetBalance } from './utils/types'
import BridgeTypeFootnote from './components/BridgeTypeFootnote'
import { HallidayBanner } from './components/HallidayBanner'

const blockchainTitleMaxWidth = Dimensions.get('window').width * 0.5
const dropdownWidth = Dimensions.get('window').width * 0.6

const TRANSFER_ERROR = 'There was a problem with the transfer.'

const formatBalance = (balance: Big | undefined): string | undefined => {
  return balance && formatTokenAmount(balance, 6)
}

type NavigationProps = BridgeScreenProps<typeof AppNavigation.Bridge.Bridge>

const Bridge: FC = () => {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { params } = useRoute<NavigationProps['route']>()
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { activeNetwork } = useNetworks()
  const hasBeenViewedHallidayBanner = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.HALLIDAY_BANNER)
  )
  const isHallidayBannerBlocked = useSelector(
    selectIsHallidayBridgeBannerBlocked
  )
  const shouldShowHallidayBanner =
    !hasBeenViewedHallidayBanner && !isHallidayBannerBlocked
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const {
    assetBalance,
    inputAmount,
    setInputAmount,
    assetsWithBalances,
    networkFee,
    price,
    maximum,
    minimum,
    transfer,
    bridgeFee,
    bridgeType,
    amount,
    sourceNetworks,
    targetNetworks,
    sourceNetwork,
    setSourceNetwork,
    targetNetwork,
    setTargetNetwork,
    bridgeAssets,
    selectedBridgeAsset,
    setSelectedBridgeAsset,
    error,
    estimatedReceiveAmount
  } = useBridge()

  const activeAccount = useSelector(selectActiveAccount)
  const [bridgeError, setBridgeError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const nativeTokenBalance = useSelector((state: RootState) =>
    selectAvailableNativeTokenBalanceForNetworkAndAccount(
      state,
      activeNetwork.chainId,
      activeAccount?.index
    )
  )
  const selectedAssetSymbol = selectedBridgeAsset?.symbol

  const { currencyFormatter } = useApplicationContext().appHook
  const isAmountTooLow = amount !== 0n && minimum && amount < minimum
  const isAmountTooLarge = amount !== 0n && maximum && amount > maximum
  const isGaslessBlocked = useSelector(selectIsGaslessBlocked)
  const [isGaslessEligible, setIsGaslessEligible] = useState(false)

  const hasValidAmount = !isAmountTooLow && amount > 0n

  const hasInvalidReceiveAmount =
    hasValidAmount &&
    estimatedReceiveAmount !== undefined &&
    estimatedReceiveAmount === 0n

  const formattedAmountCurrency =
    hasValidAmount && price && selectedBridgeAsset
      ? currencyFormatter(
          price
            .mul(bigintToBig(amount, selectedBridgeAsset.decimals))
            .toNumber()
        )
      : UNKNOWN_AMOUNT

  const formattedReceiveAmount =
    hasValidAmount && estimatedReceiveAmount && selectedBridgeAsset
      ? bigToLocaleString(
          bigintToBig(estimatedReceiveAmount, selectedBridgeAsset.decimals)
        )
      : UNKNOWN_AMOUNT
  const formattedReceiveAmountCurrency =
    hasValidAmount && price && estimatedReceiveAmount && selectedBridgeAsset
      ? currencyFormatter(
          price
            .mul(
              bigintToBig(estimatedReceiveAmount, selectedBridgeAsset.decimals)
            )
            .toNumber()
        )
      : UNKNOWN_AMOUNT

  const shouldCheckNativeBalance = isGaslessBlocked || !isGaslessEligible

  const isNativeBalanceNotEnoughForNetworkFee = Boolean(
    shouldCheckNativeBalance &&
      amount !== 0n &&
      networkFee &&
      nativeTokenBalance <
        networkFee +
          (assetBalance?.asset.type === TokenType.NATIVE ? amount : 0n)
  )

  const transferDisabled =
    isPending ||
    isAmountTooLow ||
    isAmountTooLarge ||
    isNativeBalanceNotEnoughForNetworkFee ||
    amount === 0n ||
    hasInvalidReceiveAmount

  useEffect(() => {
    setSourceNetwork(activeNetwork)
  }, [activeNetwork, setSourceNetwork])

  useEffect(() => {
    if (!sourceNetwork) return

    dispatch(setActive(sourceNetwork.chainId))
    // Reset because a denomination change will change its value
    setInputAmount(undefined)
  }, [sourceNetwork, dispatch, setInputAmount])

  const handleSelect = useCallback(
    (token: AssetBalance): void => {
      setSelectedBridgeAsset(token.asset)
    },
    [setSelectedBridgeAsset]
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

  useEffect(() => {
    const checkGaslessEligibility = async (): Promise<void> => {
      if (!sourceNetwork?.chainId || !selectedBridgeAsset) {
        setIsGaslessEligible(false)
        return
      }

      try {
        const isEligible = await GaslessService.isEligibleForChain(
          sourceNetwork.chainId.toString()
        )
        setIsGaslessEligible(isEligible)
      } catch (err) {
        Logger.error(`[Bridge.tsx][checkGaslessEligibility]${err}`)
        setIsGaslessEligible(false)
      }
    }

    checkGaslessEligibility()
  }, [sourceNetwork?.chainId, selectedBridgeAsset])

  const bridgeTokenList = useMemo(
    () =>
      (assetsWithBalances ?? []).filter(asset =>
        bridgeAssets
          .map(bridgeAsset => bridgeAsset.symbol)
          .includes(asset.symbolOnNetwork ?? asset.asset.symbol)
      ),
    [assetsWithBalances, bridgeAssets]
  )

  useEffect(() => {
    if (
      bridgeTokenList.length === 1 &&
      bridgeTokenList[0]?.asset &&
      selectedBridgeAsset === undefined
    ) {
      setSelectedBridgeAsset(bridgeTokenList[0].asset)
    }
  }, [bridgeTokenList, setSelectedBridgeAsset, selectedBridgeAsset])

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
      const bigValue = value.bn
      if (bridgeError) {
        setBridgeError('')
      }
      try {
        setInputAmount(bigValue)
      } catch (e) {
        Logger.error('failed to set amount', e)
      }
    },
    [bridgeError, setInputAmount]
  )

  const [previousConfig, setPreviousConfig] = useState<{
    sourceNetwork: Network
    bridgeAsset: BridgeAsset | undefined
  }>()

  useEffect(() => {
    if (previousConfig?.bridgeAsset) {
      const bridgeAssetSymbol = unwrapAssetSymbol(
        previousConfig.bridgeAsset.symbol
      )

      const postfix =
        previousConfig.sourceNetwork.vmName === NetworkVMType.BITCOIN
          ? '.b'
          : '.e'

      const bridgeAsset =
        bridgeAssets.find(asset => asset.symbol === bridgeAssetSymbol) ??
        bridgeAssets.find(
          asset => asset.symbol === wrapAssetSymbol(bridgeAssetSymbol, postfix)
        )

      if (bridgeAsset) {
        setSelectedBridgeAsset(bridgeAsset)
      }
    }
  }, [previousConfig, setSelectedBridgeAsset, bridgeAssets, setInputAmount])

  useEffect(() => {
    if (
      previousConfig?.sourceNetwork &&
      targetNetworks.findIndex(
        network => network.chainId === previousConfig.sourceNetwork.chainId
      ) !== -1
    ) {
      setTargetNetwork(previousConfig.sourceNetwork)

      setPreviousConfig(undefined)
    }
  }, [
    selectedBridgeAsset,
    previousConfig?.sourceNetwork,
    targetNetworks,
    setTargetNetwork,
    setPreviousConfig,
    setInputAmount
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

  const handleTransfer = async (): Promise<void> => {
    if (
      amount === 0n ||
      !sourceNetwork ||
      !targetNetwork ||
      !selectedBridgeAsset
    ) {
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
            fee: bigintToBig(bridgeFee, selectedBridgeAsset.decimals).toNumber()
          })
          return
        }
        transferError instanceof Error && setBridgeError(transferError.message)
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
    textVariant: 'buttonLarge' | 'buttonMedium',
    testID?: string
  ): JSX.Element => {
    return (
      <>
        <NetworkLogo logoUri={network?.logoUri} size={32} />
        <Space x={8} />
        <Text
          testID={testID}
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

  const renderNetwork = (
    network: Network | undefined,
    testID?: string
  ): JSX.Element => {
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingLeft: 16,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
        {renderNetworkItem(network, 'buttonLarge', testID)}
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
          {renderNetworkItem(
            network,
            'buttonMedium',
            `dropdown_item__${network.chainName}`
          )}
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
            selectionRenderItem={() =>
              renderNetwork(sourceNetwork, 'from_blockchain')
            }
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
    return (
      <Text
        variant="caption"
        sx={{ color: '$neutral300', alignSelf: 'flex-end', paddingEnd: 16 }}>
        {`Balance: `}
        {selectedBridgeAsset && assetBalance?.balance !== undefined
          ? `${formatBalance(
              bigintToBig(assetBalance.balance, selectedBridgeAsset.decimals)
            )}  ${selectedAssetSymbol}`
          : selectedBridgeAsset && <ActivityIndicator size={'small'} />}
      </Text>
    )
  }
  const renderTokenSelectInput = (): JSX.Element => (
    <Pressable onPress={() => navigateToTokenSelector()}>
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
                assetsWithBalances?.find(
                  asset => asset.symbol === selectedAssetSymbol
                )?.logoUri
              }
            />
            <Space x={8} />
          </>
        )}
        <Text
          testID="selected_token"
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
    if (!maximum || !selectedBridgeAsset) {
      return
    }
    handleAmountChanged({
      bn: maximum,
      amount: bigToLocaleString(
        bigintToBig(maximum, selectedBridgeAsset.decimals),
        4
      )
    })
  }, [selectedBridgeAsset, handleAmountChanged, maximum])

  const renderAmountInput = (): JSX.Element | undefined => {
    return (
      <View>
        <BNInput
          value={inputAmount}
          denomination={selectedBridgeAsset?.decimals ?? 0}
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
        {!selectedBridgeAsset && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => navigateToTokenSelector()}
          />
        )}
      </View>
    )
  }

  const renderError = (): JSX.Element | null => {
    if (amount === 0n || !selectedBridgeAsset) return null

    if (isAmountTooLow)
      return (
        <Text
          testID="bridge_error"
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>
          {`Amount too low -- minimum is ${bigintToBig(
            minimum,
            selectedBridgeAsset.decimals
          )?.toFixed(9)}`}
        </Text>
      )

    if (isAmountTooLarge)
      return (
        <Text
          testID="bridge_error"
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
          testID="bridge_error"
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
          testID="bridge_error"
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>
          {`Receive amount can't be 0`}
        </Text>
      )

    if (isNativeBalanceNotEnoughForNetworkFee) {
      return (
        <Text
          testID="bridge_error"
          variant="caption"
          sx={{
            color: '$dangerDark'
          }}>{`Insufficient balance to cover gas costs.\nPlease add ${sourceNetwork?.networkToken.symbol}.`}</Text>
      )
    }

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
              {formattedAmountCurrency !== UNKNOWN_AMOUNT && (
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
        testID="bridge_toggle_btn"
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
            renderNetwork(targetNetwork, 'to_blockchain')
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
              selectionRenderItem={() =>
                renderNetwork(targetNetwork, 'to_blockchain')
              }
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
            {formattedReceiveAmount !== UNKNOWN_AMOUNT && (
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
            {formattedReceiveAmountCurrency !== UNKNOWN_AMOUNT && (
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
        testID="bridge_btn"
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
        {shouldShowHallidayBanner && (
          <>
            <HallidayBanner />
            <Space y={40} />
          </>
        )}
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
      {renderTransferBtn()}
      {bridgeType && <BridgeTypeFootnote bridgeType={bridgeType} />}
    </SafeAreaProvider>
  )
}

export default Bridge
