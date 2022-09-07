import React, { FC } from 'react'
import { Dimensions, Pressable } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import LinkSVG from 'components/svg/LinkSVG'
import AvaButton from 'components/AvaButton'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'
import ClearSVG from 'components/svg/ClearSVG'

const WINDOW_WIDTH = Dimensions.get('window').width

export enum TransactionToastType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PENDING = 'PENDING'
}

interface Props {
  message: string
  toastId?: string
  type?: TransactionToastType
  txHash?: string
}

const TransactionToast: FC<Props> = ({ message, toastId, type, txHash }) => {
  const theme = useApplicationContext().theme
  const network = useActiveNetwork()
  const { openUrl } = useInAppBrowser()

  function dismissToast() {
    toastId ? global?.toast?.hide(toastId) : global?.toast.hideAll()
  }

  return (
    <AvaButton.Base
      onPress={() => {
        dismissToast()
      }}
      style={{
        backgroundColor: theme.neutral850,
        borderRadius: 8,
        justifyContent: 'center',
        width: WINDOW_WIDTH * 0.89,
        paddingHorizontal: 8,
        height: type === TransactionToastType.PENDING ? 60 : 76
      }}>
      {txHash ? (
        <AvaText.Caption
          color={
            type === TransactionToastType.PENDING
              ? theme.colorText1
              : type === TransactionToastType.SUCCESS
              ? theme.colorSuccess
              : theme.colorError
          }>
          {message}
        </AvaText.Caption>
      ) : (
        <AvaText.ButtonLarge
          color={
            type === TransactionToastType.PENDING
              ? theme.colorText1
              : type === TransactionToastType.SUCCESS
              ? theme.colorSuccess
              : theme.colorError
          }>
          {message}
        </AvaText.ButtonLarge>
      )}
      {!!txHash && network && (
        <AvaText.ButtonLarge
          color={theme.colorText1}
          onPress={() => {
            openUrl(getExplorerAddressByNetwork(network, txHash))
            dismissToast()
          }}>
          View in Explorer <LinkSVG color={theme.colorText1} />{' '}
        </AvaText.ButtonLarge>
      )}
      <Pressable
        style={{ position: 'absolute', top: 10, right: 10 }}
        onPress={dismissToast}>
        <ClearSVG color={theme.white} backgroundColor={theme.transparent} />
      </Pressable>
    </AvaButton.Base>
  )
}

export default TransactionToast
