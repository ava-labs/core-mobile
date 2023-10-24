import React, { FC } from 'react'
import { Dimensions, Pressable, StyleProp, ViewStyle } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import LinkSVG from 'components/svg/LinkSVG'
import AvaButton from 'components/AvaButton'
import ClearSVG from 'components/svg/ClearSVG'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { navigate } from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { NetworkTokensTabs } from 'screens/portfolio/network/NetworkTokens'

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
  testID?: string
}

const SimpleToast = ({
  message,
  color
}: {
  message: string
  color: string
}): JSX.Element => {
  return <AvaText.ButtonLarge color={color}>{message}</AvaText.ButtonLarge>
}

const ToastWithViewActivity = ({
  txHash,
  message,
  color
}: {
  txHash: string
  message: string
  color: string
}): JSX.Element => {
  const theme = useApplicationContext().theme
  const network = useSelector(selectActiveNetwork)

  const openActivityTab = (): void => {
    navigate({
      // @ts-ignore
      name: AppNavigation.Portfolio.NetworkTokens,
      // @ts-ignore
      params: { tabIndex: NetworkTokensTabs.Activity }
    })
    dismissToast()
  }

  return (
    <>
      <AvaText.ButtonSmall color={color} textStyle={{ marginBottom: 2 }}>
        {message}
      </AvaText.ButtonSmall>
      {!!txHash && network && (
        <AvaText.ButtonLarge color={theme.colorText1} onPress={openActivityTab}>
          {'View in Activity  '}
          <Pressable onPress={openActivityTab}>
            <LinkSVG color={theme.colorText1} />
          </Pressable>
        </AvaText.ButtonLarge>
      )}
    </>
  )
}

const Pending = ({ message }: { message: string }): JSX.Element => {
  const theme = useApplicationContext().theme

  return <SimpleToast message={message} color={theme.colorText1} />
}

const Error = ({
  txHash,
  message
}: {
  txHash?: string
  message: string
}): JSX.Element => {
  const theme = useApplicationContext().theme

  if (!txHash) return <SimpleToast message={message} color={theme.colorError} />

  return (
    <ToastWithViewActivity
      txHash={txHash}
      message={message}
      color={theme.colorError}
    />
  )
}

const Success = ({
  txHash,
  message
}: {
  txHash?: string
  message: string
}): JSX.Element => {
  const theme = useApplicationContext().theme

  if (!txHash)
    return <SimpleToast message={message} color={theme.colorSuccess} />

  return (
    <ToastWithViewActivity
      txHash={txHash}
      message={message}
      color={theme.colorSuccess}
    />
  )
}

const dismissToast = (toastId?: string): void => {
  toastId ? global?.toast?.hide(toastId) : global?.toast.hideAll()
}

const getToastHeight = (
  type: TransactionToastType,
  txHash?: string
): number | undefined => {
  if (
    txHash &&
    (type === TransactionToastType.ERROR ||
      type === TransactionToastType.SUCCESS)
  ) {
    return 76
  }

  return undefined
}

const TransactionToast: FC<Props> = ({ message, toastId, type, txHash }) => {
  const theme = useApplicationContext().theme

  const renderContent = (): JSX.Element => {
    switch (type) {
      case TransactionToastType.PENDING:
        return <Pending message={message} />
      case TransactionToastType.ERROR:
        return <Error message={message} txHash={txHash} />
      case TransactionToastType.SUCCESS:
        return <Success message={message} txHash={txHash} />
    }
  }

  const hideToast = (): void => dismissToast(toastId)

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
