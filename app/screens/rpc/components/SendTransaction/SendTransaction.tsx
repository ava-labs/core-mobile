// noinspection JSUnusedLocalSymbols

import React, { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import ExportTxView from 'screens/rpc/components/SendTransaction/ExportTxView'
import ImportTxView from 'screens/rpc/components/SendTransaction/ImportTxView'
import BaseTxView from 'screens/rpc/components/SendTransaction/BaseTxView'
import AddValidatorTxView from 'screens/rpc/components/SendTransaction/AddValidatorTxView'
import AddDelegatorTxView from 'screens/rpc/components/SendTransaction/AddDelegatorTxView'
import { useDappConnectionV1 } from 'hooks/useDappConnectionV1'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'

type SendTransactionScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SendTransaction
>

const SendTransaction = () => {
  const { theme } = useApplicationContext()

  const { goBack } = useNavigation<SendTransactionScreenProps['navigation']>()
  const { request, data } =
    useRoute<SendTransactionScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV1()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const onHandleApprove = () => {
    onApprove(request, data)
    goBack()
  }

  const renderApproveRejectButtons = () => {
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

  function renderSendDetails() {
    switch (data.txData.type) {
      case 'export':
        return <ExportTxView tx={data.txData} avaxPrice={12} />
      case 'import':
        return <ImportTxView tx={data.txData} avaxPrice={12} />
      case 'base':
        return <BaseTxView tx={data.txData} avaxPrice={12} />
      case 'add_validator':
        return <AddValidatorTxView tx={data.txData} avaxPrice={12} />
      case 'add_delegator':
        return <AddDelegatorTxView tx={data.txData} avaxPrice={12} />
    }
  }

  return (
    <RpcRequestBottomSheet onClose={rejectAndClose}>
      <View style={txStyles.scrollView}>{renderSendDetails()}</View>
      <View>
        {data.txData.type === 'base' && <Separator color={theme.neutral800} />}
        {renderApproveRejectButtons()}
      </View>
    </RpcRequestBottomSheet>
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

export default SendTransaction
