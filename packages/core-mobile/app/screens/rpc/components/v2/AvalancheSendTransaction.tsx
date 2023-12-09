// noinspection JSUnusedLocalSymbols

import React, { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'
import { ScrollView } from 'react-native-gesture-handler'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import AddDelegatorTxView from 'screens/rpc/components/shared/AvalancheSendTransaction/AddDelegatorTxView'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { useSelector } from 'react-redux'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import ExportTxView from '../shared/AvalancheSendTransaction/ExportTxView'
import ImportTxView from '../shared/AvalancheSendTransaction/ImportTxView'
import BaseTxView from '../shared/AvalancheSendTransaction/BaseTxView'
import AddValidatorTxView from '../shared/AvalancheSendTransaction/AddValidatorTxView'
import AddSubnetValidatorTxView from '../shared/AvalancheSendTransaction/AddSubnetValidatorView'
import CreateChainTxView from '../shared/AvalancheSendTransaction/CreateChainView'
import CreateSubnetTxView from '../shared/AvalancheSendTransaction/CreateSubnetView'

type AvalancheSendTransactionV2ScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.AvalancheSendTransactionV2
>

const AvalancheSendTransactionV2 = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { theme } = useApplicationContext()

  const { goBack } =
    useNavigation<AvalancheSendTransactionV2ScreenProps['navigation']>()
  const { request, data } =
    useRoute<AvalancheSendTransactionV2ScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const hexData = JSON.parse(data.unsignedTxJson).txBytes

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const onHandleApprove = (): void => {
    onApprove(request, data)
    goBack()
  }

  const [hideActionButtons, sethideActionButtons] = useState(false)
  const toggleActionButtons = (value: boolean): void => {
    sethideActionButtons(value)
  }

  const renderApproveRejectButtons = (): JSX.Element => {
    return (
      <>
        <FlexSpacer />
        <View style={txStyles.actionContainer}>
          <AvaButton.PrimaryLarge onPress={onHandleApprove}>
            Approve
          </AvaButton.PrimaryLarge>
          <Space y={16} />
          <AvaButton.SecondaryLarge onPress={rejectAndClose}>
            Reject
          </AvaButton.SecondaryLarge>
        </View>
      </>
    )
  }

  function renderSendDetails(): JSX.Element | undefined {
    switch (data.txData.type) {
      case 'export':
        return (
          <ExportTxView
            tx={data.txData}
            hexData={hexData}
            toggleActionButtons={toggleActionButtons}
          />
        )
      case 'import':
        return (
          <ImportTxView
            tx={data.txData}
            hexData={hexData}
            toggleActionButtons={toggleActionButtons}
          />
        )
      case 'base':
        return <BaseTxView tx={data.txData} />
      case 'add_validator':
        return <AddValidatorTxView tx={data.txData} />
      case 'add_delegator':
        return <AddDelegatorTxView tx={data.txData} />
      case 'add_subnet_validator':
        return <AddSubnetValidatorTxView tx={data.txData} />
      case 'create_chain':
        return <CreateChainTxView tx={data.txData} />
      case 'create_subnet':
        return <CreateSubnetTxView tx={data.txData} />
    }
  }

  return (
    <>
      <RpcRequestBottomSheet onClose={rejectAndClose}>
        <ScrollView contentContainerStyle={txStyles.scrollView}>
          <View style={{ flexGrow: 1 }}>{renderSendDetails()}</View>
          <View>
            {data.txData.type === 'base' && (
              <Separator color={theme.neutral800} />
            )}

            {!hideActionButtons && renderApproveRejectButtons()}
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

export const txStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 14
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 40,
    paddingHorizontal: 14
  }
})

export default AvalancheSendTransactionV2
