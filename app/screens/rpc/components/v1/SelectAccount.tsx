import React, { useCallback } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AccountItem from 'screens/portfolio/account/AccountItem'
import WalletSVG from 'components/svg/WalletSVG'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV1 } from 'hooks/useDappConnectionV1'
import SimplePrompt from '../shared/SimplePrompt'

type SelectAccountScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SelectAccount
>

const SelectAccount = () => {
  const { goBack } = useNavigation<SelectAccountScreenProps['navigation']>()

  const { request, account } =
    useRoute<SelectAccountScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV1()

  const theme = useApplicationContext().theme
  const {
    payload: { peerMeta }
  } = request

  const header = `Switch to ${account.title}?`

  const description =
    new URL(peerMeta?.url ?? '').hostname +
    ' is requesting to switch your active account.'

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { account })
    goBack()
  }, [account, goBack, onApprove, request])

  const renderWalletIcon = () => (
    <WalletSVG size={48} backgroundColor={theme.colorBg3} />
  )

  const renderAccount = () => <AccountItem account={account} />

  return (
    <SimplePrompt
      onApprove={approveAndClose}
      onReject={rejectAndClose}
      header={header}
      description={description}
      renderIcon={renderWalletIcon}
      renderContent={renderAccount}
    />
  )
}

export default SelectAccount
