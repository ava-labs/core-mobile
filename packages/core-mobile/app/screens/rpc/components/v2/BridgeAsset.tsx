import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { humanize } from 'utils/string/humanize'
import Avatar from 'components/Avatar'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useSelector } from 'react-redux'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { Eip1559Fees } from 'utils/Utils'
import { NetworkTokenUnit } from 'types'
import BridgeService from 'services/bridge/BridgeService'
import Big from 'big.js'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectBridgeAppConfig } from 'store/bridge'
import { selectSelectedCurrency } from 'store/settings/currency'
import Logger from 'utils/Logger'
import { View } from '@avalabs/k2-mobile'
import { useNetworks } from 'hooks/networks/useNetworks'
import SimplePrompt from '../shared/SimplePrompt'

type BridgeAssetScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BridgeAssetV2
>

const BridgeAsset = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { goBack } = useNavigation<BridgeAssetScreenProps['navigation']>()

  const { request, asset, amountStr, currentBlockchain } =
    useRoute<BridgeAssetScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const { activeNetwork, networks } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const isTestnet = useSelector(selectIsDeveloperMode)
  const config = useSelector(selectBridgeAppConfig)
  const currency = useSelector(selectSelectedCurrency)

  const [fees, setFees] = useState<Eip1559Fees<NetworkTokenUnit>>({
    gasLimit: 0,
    maxFeePerGas: NetworkTokenUnit.fromNetwork(activeNetwork),
    maxPriorityFeePerGas: NetworkTokenUnit.fromNetwork(activeNetwork)
  })
  const [gasLimit, setGasLimit] = useState(0)

  const theme = useContext(ApplicationContext).theme
  const peerMeta = request.peerMeta
  const symbol = asset.symbol

  const header = 'Approve Action'

  const description =
    new URL(peerMeta?.url ?? '').hostname +
    ' wants to perform the following action'

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, {
      currentBlockchain,
      amountStr,
      asset,
      maxFeePerGas: fees.maxFeePerGas.toSubUnit(),
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas.toSubUnit()
    })
    goBack()
  }, [amountStr, asset, currentBlockchain, fees, goBack, onApprove, request])

  const handleFeesChange = (
    eip1559Fees: Eip1559Fees<NetworkTokenUnit>
  ): void => {
    setFees(eip1559Fees)
  }

  const renderIcon = (): JSX.Element => (
    <Avatar.Custom
      name={peerMeta?.name ?? ''}
      size={48}
      logoUri={peerMeta?.icons[0]}
    />
  )

  useEffect(() => {
    const getEstimatedGasLimit = async (): Promise<void> => {
      const estimatedGasLimit = await BridgeService.estimateGas({
        currentBlockchain,
        amount: Big(amountStr),
        asset,
        allNetworks: networks,
        activeNetwork,
        activeAccount,
        isTestnet,
        config,
        currency
      })
      estimatedGasLimit && setGasLimit(Number(estimatedGasLimit))
    }
    getEstimatedGasLimit().catch(e => {
      Logger.error('Failed to estimate gas limit', e)
    })
  }, [
    activeAccount,
    activeNetwork,
    networks,
    amountStr,
    asset,
    config,
    currency,
    currentBlockchain,
    isTestnet
  ])

  const renderContent = (): JSX.Element => {
    return (
      <ScrollView>
        <AvaText.Body1
          color={theme.colorPrimary1}
          textStyle={{ alignSelf: 'center' }}>
          Core wants to bridge
        </AvaText.Body1>
        <Space y={8} />
        <AvaText.Heading3>Message:</AvaText.Heading3>
        <Space y={8} />
        <View
          style={{
            flexGrow: 1,
            backgroundColor: theme.colorBg3,
            borderRadius: 8,
            padding: 8
          }}>
          <AvaText.Body1>{`You are about to bridge ${amountStr} ${symbol} on ${humanize(
            currentBlockchain
          )} Network`}</AvaText.Body1>
        </View>
        <Space y={12} />
        <NetworkFeeSelector
          gasLimit={gasLimit}
          onFeesChange={handleFeesChange}
          isGasLimitEditable={false}
        />
      </ScrollView>
    )
  }

  return (
    <>
      <SimplePrompt
        onApprove={approveAndClose}
        onReject={rejectAndClose}
        header={header}
        description={description}
        renderIcon={renderIcon}
        renderContent={renderContent}
      />
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

export default BridgeAsset
