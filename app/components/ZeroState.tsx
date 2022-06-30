import React, { FC, ReactNode } from 'react'
import { Image, View } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from './AvaText'

interface BaseProps {
  image?: string | ReactNode
  title?: string | ReactNode
  message?: string | ReactNode
  additionalComponent?: ReactNode
}

const ZeroStateBase: FC<BaseProps> = ({
  image,
  title,
  message,
  additionalComponent
}) => {
  const { theme } = useApplicationContext()
  function getImage() {
    if (!image) {
      return null
    }

    if (typeof image === 'string') {
      return <Image source={{ uri: image }} />
    }
    return <View>{image}</View>
  }

  function getTitle() {
    if (typeof title === 'string') {
      return (
        <AvaText.Heading2 textStyle={{ marginTop: 16 }}>
          {title}
        </AvaText.Heading2>
      )
    }
    return <View style={{ marginTop: 16 }}>{title}</View>
  }

  function getMessage() {
    if (typeof message === 'string') {
      return (
        <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
          {message}
        </AvaText.Body2>
      )
    }
    return <View>{message}</View>
  }

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
      }}>
      {getImage() && (
        <>
          <Space y={52} />
          {getImage()}
          <Space y={52} />
        </>
      )}
      {getTitle()}
      <Space y={16} />
      {getMessage()}
      {additionalComponent && (
        <>
          <Space y={48} />
          {additionalComponent}
        </>
      )}
    </View>
  )
}

type ZeroStateSendErrorProps = Pick<
  BaseProps,
  'additionalComponent' | 'message'
>

function ZeroStateSendError({
  additionalComponent,
  message
}: ZeroStateSendErrorProps) {
  const title = 'Oops, something went wrong'
  return (
    <ZeroStateBase
      title={title}
      message={message ?? 'An unknown error as occurred.'}
      additionalComponent={additionalComponent}
    />
  )
}

function ZeroStateNetworkTokens({
  showReceiveBtn = false,
  goToReceive,
  goToAddAssets
}: {
  showReceiveBtn: boolean
  goToReceive: () => void
  goToAddAssets: () => void
}) {
  const title = 'No assets'

  const renderButton = (label: string, onPress: () => void) => (
    <AvaButton.PrimaryMedium
      style={{ width: '100%' }}
      textStyle={{ fontSize: 16 }}
      onPress={onPress}>
      {label}
    </AvaButton.PrimaryMedium>
  )
  if (showReceiveBtn) {
    return (
      <ZeroStateBase
        title={title}
        message="Receive assets by clicking the button below."
        additionalComponent={renderButton('Receive', goToReceive)}
      />
    )
  }

  return (
    <ZeroStateBase
      title={title}
      message="Add assets by clicking the button below."
      additionalComponent={renderButton('Add Assets', goToAddAssets)}
    />
  )
}

function ZeroStateCollectibles() {
  const title = 'No Collectibles'
  const message = 'You don’t have any collectibles yet.'

  return (
    <ZeroStateBase
      title={title}
      message={message}
      additionalComponent={
        <AvaButton.PrimaryMedium>Explore NFTs</AvaButton.PrimaryMedium>
      }
    />
  )
}

function ZeroStateNoRecentAccounts() {
  const title = 'No recent recipients'
  const message = 'Enter the address in the field above.'

  return <ZeroStateBase title={title} message={message} />
}

function ZeroStateNoFavoriteNetworks() {
  const title = 'No favorites'
  const message = 'Select one from other two lists'

  return <ZeroStateBase title={title} message={message} />
}

function ZeroStateEmptyAddressBook({
  onGoToAddressBook
}: {
  onGoToAddressBook: () => void
}) {
  const title = 'No addresses'
  const message = 'You can add addresses in Address Book'

  return (
    <ZeroStateBase
      title={title}
      message={message}
      additionalComponent={
        <AvaButton.PrimaryMedium onPress={onGoToAddressBook}>
          Go to Address Book
        </AvaButton.PrimaryMedium>
      }
    />
  )
}

type NoResultsProps = Pick<BaseProps, 'message'>

// removed "man with lantern" as per ux request
function ZeroStateNoResults({ message }: NoResultsProps) {
  return <ZeroStateBase message={message ?? 'No results found'} />
}

function ZeroStateComingSoon() {
  return <ZeroStateBase title={'Coming soon!'} />
}

const ZeroState = {
  NetworkTokens: ZeroStateNetworkTokens,
  Collectibles: ZeroStateCollectibles,
  NoResultsTextual: ZeroStateNoResults,
  NoRecentAccounts: ZeroStateNoRecentAccounts,
  NoFavoriteNetworks: ZeroStateNoFavoriteNetworks,
  EmptyAddressBook: ZeroStateEmptyAddressBook,
  ComingSoon: ZeroStateComingSoon,
  SendError: ZeroStateSendError
}

export default ZeroState
