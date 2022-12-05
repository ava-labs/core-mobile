import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { AvalancheSelectAccountRequest } from 'store/walletConnect/handlers/avalanche_selectAccount'
import AccountItem from 'screens/portfolio/account/AccountItem'
import WalletSVG from 'components/svg/WalletSVG'
import SimplePrompt from './SimplePrompt'

interface Props {
  dappEvent: AvalancheSelectAccountRequest
  onApprove: (request: AvalancheSelectAccountRequest) => void
  onReject: (request: AvalancheSelectAccountRequest, message?: string) => void
  onClose: (request: AvalancheSelectAccountRequest) => void
}

const SelectAccount: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const theme = useApplicationContext().theme
  const {
    data: { account },
    payload: { peerMeta }
  } = dappEvent

  const header = `Switch to ${account.title}?`

  const description =
    new URL(peerMeta?.url ?? '').hostname +
    ' is requesting to switch your active account.'

  const renderWalletIcon = () => (
    <WalletSVG size={48} backgroundColor={theme.colorBg3} />
  )

  const renderAccount = () => <AccountItem account={account} />

  return (
    <SimplePrompt
      onApprove={() => onApprove(dappEvent)}
      onReject={() => {
        onReject(dappEvent)
        onClose(dappEvent)
      }}
      header={header}
      description={description}
      renderIcon={renderWalletIcon}
      renderContent={renderAccount}
    />
  )
}

export default SelectAccount
