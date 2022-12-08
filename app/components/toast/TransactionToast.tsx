import React, { FC } from 'react'
import { Dimensions, Pressable, StyleProp, ViewStyle } from 'react-native'
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
  type: TransactionToastType
  txHash?: string
  toastId?: string
}

const SimpleToast = ({
  message,
  color
}: {
  message: string
  color: string
}) => {
  return <AvaText.ButtonLarge color={color}>{message}</AvaText.ButtonLarge>
}

const ToastWithExplorerLink = ({
  txHash,
  message,
  color
}: {
  txHash: string
  message: string
  color: string
}) => {
  const theme = useApplicationContext().theme
  const network = useActiveNetwork()
  const { openUrl } = useInAppBrowser()

  return (
    <>
      <AvaText.ButtonSmall color={color} textStyle={{ marginBottom: 2 }}>
        {message}
      </AvaText.ButtonSmall>
      {!!txHash && network && (
        <AvaText.ButtonLarge
          color={theme.colorText1}
          onPress={() => {
            openUrl(getExplorerAddressByNetwork(network, txHash))
            dismissToast()
          }}>
          {'View in Explorer  '}
          <LinkSVG color={theme.colorText1} />
        </AvaText.ButtonLarge>
      )}
    </>
  )
}

const Pending = ({ message }: { message: string }) => {
  const theme = useApplicationContext().theme

  return <SimpleToast message={message} color={theme.colorText1} />
}

const Error = ({ txHash, message }: { txHash?: string; message: string }) => {
  const theme = useApplicationContext().theme

  if (!txHash) return <SimpleToast message={message} color={theme.colorError} />

  return (
    <ToastWithExplorerLink
      txHash={txHash}
      message={message}
      color={theme.colorError}
    />
  )
}

const Success = ({ txHash, message }: { txHash?: string; message: string }) => {
  const theme = useApplicationContext().theme

  if (!txHash)
    return <SimpleToast message={message} color={theme.colorSuccess} />

  return (
    <ToastWithExplorerLink
      txHash={txHash}
      message={message}
      color={theme.colorSuccess}
    />
  )
}

const dismissToast = (toastId?: string) => {
  toastId ? global?.toast?.hide(toastId) : global?.toast.hideAll()
}

const getToastHeight = (type: TransactionToastType, txHash?: string) => {
  if (txHash) {
    if (
      type === TransactionToastType.ERROR ||
      type === TransactionToastType.SUCCESS
    )
      return 76
  }

  return undefined
}

const TransactionToast: FC<Props> = ({ message, toastId, type, txHash }) => {
  const theme = useApplicationContext().theme

  const renderContent = () => {
    switch (type) {
      case TransactionToastType.PENDING:
        return <Pending message={message} />
      case TransactionToastType.ERROR:
        return <Error message={message} txHash={txHash} />
      case TransactionToastType.SUCCESS:
        return <Success message={message} txHash={txHash} />
    }
  }

  const hideToast = () => dismissToast(toastId)

  const style = {
    backgroundColor: theme.neutral850,
    borderRadius: 8,
    justifyContent: 'center',
    width: WINDOW_WIDTH * 0.89,
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: getToastHeight(type, txHash),
    minHeight: 60
  } as StyleProp<ViewStyle>

  return (
    <AvaButton.Base onPress={hideToast} style={style}>
      {renderContent()}
      <Pressable
        style={{ position: 'absolute', top: 10, right: 10 }}
        onPress={hideToast}>
        <ClearSVG color={theme.white} backgroundColor={theme.transparent} />
      </Pressable>
    </AvaButton.Base>
  )
}

export default TransactionToast
