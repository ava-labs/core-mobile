import React, { useCallback, useMemo, useState } from 'react'
import { Space } from 'components/Space'
import { ScrollView } from 'react-native-gesture-handler'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { useSelector } from 'react-redux'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { Eip1559Fees } from 'utils/Utils'
import SendRow from 'components/SendRow'
import { Text, View } from '@avalabs/k2-mobile'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { NetworkTokenUnit } from 'types'
import { getBitcoinNetwork } from 'services/network/utils/providerUtils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TokenBaseUnit } from 'types/TokenBaseUnit'
import { selectTokensWithBalanceByNetwork } from 'store/balance/slice'
import { mustNumber } from 'utils/JsTools'
import { BitcoinSendTransactionApproveData } from 'store/rpc/handlers/bitcoin_sendTransaction/bitcoin_sendTransaction'
import { SendState } from 'services/send/types'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { selectBridgeCriticalConfig } from 'store/bridge'
import { isBtcBridge } from 'utils/isBtcBridge'

type BitcoinSendTransactionScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BitcoinSendTransaction
>

const BitcoinSendTransaction = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const activeAccount = useSelector(selectActiveAccount)
  const {
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
  const { goBack } =
    useNavigation<BitcoinSendTransactionScreenProps['navigation']>()
  const { request, data } =
    useRoute<BitcoinSendTransactionScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const btcNetwork = getBitcoinNetwork(isDeveloperMode)
  const { sendState } = data
  const bridgeConfig = useSelector(selectBridgeCriticalConfig)
  const allAccounts = useSelector(selectAccounts)
  const toAccountName =
    Object.values(allAccounts).find(a => a.addressBTC === sendState.address)
      ?.name ?? 'Address'

  const [maxFeePerGas, setMaxFeePerGas] = useState<
    TokenBaseUnit<NetworkTokenUnit>
  >(NetworkTokenUnit.fromNetwork(btcNetwork, sendState.defaultMaxFeePerGas))

  const tokens = useSelector(selectTokensWithBalanceByNetwork(btcNetwork))

  const btcToken = tokens.find(t => t.symbol === 'BTC')
  const tokenPriceInSelectedCurrency = btcToken?.priceInCurrency ?? 0
  const amountInBtc = NetworkTokenUnit.fromNetwork(btcNetwork, sendState.amount)
  const sendAmountInCurrency = amountInBtc.mul(tokenPriceInSelectedCurrency)

  const balanceAfterTrx = useMemo(() => {
    let balanceBN = btcToken?.balance
    if (activeAccount?.addressBTC !== sendState.address && balanceBN) {
      balanceBN -= sendState.amount ?? 0n
    }
    return NetworkTokenUnit.fromNetwork(btcNetwork, balanceBN)
      .sub(maxFeePerGas.mul(sendState.gasLimit ?? 0))
      .toFixed(4)
  }, [
    activeAccount?.addressBTC,
    btcNetwork,
    btcToken?.balance,
    maxFeePerGas,
    sendState.address,
    sendState.amount,
    sendState.gasLimit
  ])

  const balanceAfterTrxInCurrency = useMemo(
    () =>
      (
        tokenPriceInSelectedCurrency *
        mustNumber(() => parseFloat(balanceAfterTrx), 0)
      ).toFixed(2),
    [balanceAfterTrx, tokenPriceInSelectedCurrency]
  )

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const onHandleApprove = (): void => {
    onApprove(request, {
      sendState: {
        ...sendState,
        defaultMaxFeePerGas: maxFeePerGas.toSubUnit()
      } as SendState
    } as BitcoinSendTransactionApproveData)
    goBack()
  }

  const handleFeeChange = useCallback(
    (fees: Eip1559Fees<NetworkTokenUnit>) => {
      setMaxFeePerGas(fees.maxFeePerGas)
    },
    [setMaxFeePerGas]
  )

  const title = useMemo(() => {
    return sendState.address && isBtcBridge(sendState.address, bridgeConfig)
      ? 'Confirm Bridge'
      : 'Approve Transaction'
  }, [bridgeConfig, sendState.address])

  const renderNetwork = (): JSX.Element | undefined => {
    return (
      <View
        sx={{
          width: '100%'
        }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body2">Network:</Text>
          <Row style={{ alignItems: 'center' }}>
            <NetworkLogo
              key={btcNetwork.chainId.toString()}
              logoUri={btcNetwork.logoUri}
              size={24}
              style={{ marginRight: 8 }}
            />
            <Text variant="buttonMedium">{btcNetwork.chainName}</Text>
          </Row>
        </Row>
        <Space y={16} />
      </View>
    )
  }

  return (
    <>
      <RpcRequestBottomSheet
        onClose={rejectAndClose}
        showButtons
        onApprove={onHandleApprove}
        onReject={rejectAndClose}>
        <ScrollView contentContainerStyle={{ minHeight: '100%' }}>
          <View
            sx={{
              backgroundColor: '$neutral900',
              padding: 16,
              flex: 1,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8
            }}>
            <Text variant="heading4">{title}</Text>
            <Space y={32} />
            {renderNetwork()}
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text
                variant="body2"
                sx={{ textAlign: 'center', color: '$neutral400' }}>
                Amount
              </Text>
              <Row style={{ alignItems: 'center' }}>
                <Text variant="subtitle1">{Number(amountInBtc)}</Text>
                <Space x={4} />
                <Text
                  variant="subtitle1"
                  sx={{ lineHeight: 24, color: '$neutral400' }}>
                  {'BTC'}
                </Text>
              </Row>
            </Row>
            <Row style={{ justifyContent: 'flex-end' }}>
              <Text
                variant="subtitle1"
                sx={{ lineHeight: 24, color: '$neutral400' }}>
                {tokenInCurrencyFormatter(sendAmountInCurrency.toDisplay())}
              </Text>
            </Row>
            <Space y={8} />
            <SendRow
              label={'From'}
              title={activeAccount?.name ?? ''}
              address={activeAccount?.addressBTC ?? ''}
            />
            <SendRow
              label={'To'}
              title={toAccountName}
              address={sendState.address ?? ''}
            />
            <Space y={8} />
            <NetworkFeeSelector
              chainId={btcNetwork.chainId}
              gasLimit={sendState.gasLimit ?? 0}
              onFeesChange={handleFeeChange}
              maxNetworkFee={NetworkTokenUnit.fromNetwork(btcNetwork)}
            />
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="body2" sx={{ color: '$neutral400' }}>
                Balance After Transaction
              </Text>
              <Text
                variant="heading6"
                sx={{ color: '$neutral50', fontSize: 18, lineHeight: 22 }}>
                {balanceAfterTrx} {btcToken?.symbol ?? ''}
              </Text>
            </Row>
            <Text
              variant="caption"
              sx={{
                color: '$neutral50',
                alignSelf: 'flex-end',
                lineHeight: 15
              }}>
              {tokenInCurrencyFormatter(balanceAfterTrxInCurrency)}
            </Text>
          </View>
        </ScrollView>
      </RpcRequestBottomSheet>
      {isSeedlessSigningBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Signing is currently under maintenance. Service will resume shortly.'
          }
        />
      )}
    </>
  )
}

export default BitcoinSendTransaction
