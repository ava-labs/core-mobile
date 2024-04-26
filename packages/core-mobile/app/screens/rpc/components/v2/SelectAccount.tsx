import React, { useCallback } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AccountItem from 'screens/portfolio/account/AccountItem'
import WalletSVG from 'components/svg/WalletSVG'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import SimplePrompt from '../shared/SimplePrompt'

type SelectAccountScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SelectAccountV2
>

const SelectAccount = (): JSX.Element => {
  const { goBack } = useNavigation<SelectAccountScreenProps['navigation']>()

  const { request, account } =
    useRoute<SelectAccountScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const theme = useApplicationContext().theme
  const peerMeta = request.peerMeta

  const header = `Switch to ${account.name}?`

  const description =
    new URL(peerMeta.url).hostname +
    ' is requesting to switch your active account.'

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { account })
    goBack()
  }, [account, goBack, onApprove, request])

  const renderWalletIcon = (): JSX.Element => (
    <WalletSVG size={48} backgroundColor={theme.colorBg3} />
  )

  const renderAccount = (): JSX.Element => <AccountItem account={account} />

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
