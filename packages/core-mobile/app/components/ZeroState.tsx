import React, { FC, ReactNode } from 'react'
import { Image, View } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import StarSVG from 'components/svg/StarSVG'
import QRScanSVG from 'components/svg/QRScanSVG'
import AvaText from './AvaText'
import PersonSVG from './svg/PersonSVG'

interface BaseProps {
  image?: string | ReactNode
  title?: string | ReactNode
  message?: string | ReactNode
  button?: ReactNode
  testID?: string
}

const ZeroStateBase: FC<BaseProps> = ({ image, title, message, button }) => {
  const { theme } = useApplicationContext()

  function renderImage(): JSX.Element | null {
    if (!image) {
      return null
    }

    let img

    if (typeof image === 'string') {
      img = <Image source={{ uri: image }} testID="zeroStateBase" />
    } else {
      img = <View testID="zeroStateBase">{image}</View>
    }

    return (
      <>
        <Space y={52} />
        {img}
        <Space y={52} />
      </>
    )
  }

  function renderTitle(): JSX.Element {
    if (typeof title === 'string') {
      return (
        <AvaText.Heading2 textStyle={{ marginTop: 16 }}>
          {title}
        </AvaText.Heading2>
      )
    }
    return <View style={{ marginTop: 16 }}>{title}</View>
  }

  function renderMessage(): JSX.Element {
    if (typeof message === 'string') {
      return (
        <AvaText.Body2
          textStyle={{ color: theme.colorText1, textAlign: 'center' }}>
          {message}
        </AvaText.Body2>
      )
    }
    return <View>{message}</View>
  }

  function renderButton(): JSX.Element | null {
    if (!button) return null

    return (
      <>
        <Space y={48} />
        {button}
      </>
    )
  }

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 16
      }}
      testID="zeroStateBaseView">
      {renderImage()}
      {renderTitle()}
      <Space y={16} />
      {renderMessage()}
      {renderButton()}
    </View>
  )
}

function ZeroStateNetworkTokens({
  goToReceive
}: {
  goToReceive: () => void
}): JSX.Element {
  const title = 'No assets'
  const message = 'Add assets by clicking the button below.'

  const button = (
    <AvaButton.PrimaryMedium
      style={{ width: '100%' }}
      textStyle={{ fontSize: 16 }}
      onPress={goToReceive}>
      Add Assets
    </AvaButton.PrimaryMedium>
  )

  return <ZeroStateBase title={title} message={message} button={button} />
}

function ZeroStateCollectibles(): JSX.Element {
  const title = 'No Collectibles'
  const message = 'You don’t have any collectibles yet.'

  return <ZeroStateBase title={title} message={message} />
}

function ZeroStateNoRecentAccounts(): JSX.Element {
  const title = 'No recent recipients'
  const message = 'Enter the address in the field above.'

  return <ZeroStateBase title={title} message={message} />
}

function ZeroStateEmptyAddressBook({
  onGoToAddressBook
}: {
  onGoToAddressBook: () => void
}): JSX.Element {
  const title = 'No addresses'
  const message = 'You can add addresses in Address Book'

  return (
    <ZeroStateBase
      title={title}
      message={message}
      button={
        <AvaButton.PrimaryMedium onPress={onGoToAddressBook}>
          Go to Address Book
        </AvaButton.PrimaryMedium>
      }
    />
  )
}

type NoResultsProps = Pick<BaseProps, 'message'>

function ZeroStateNoResults({ message }: NoResultsProps): JSX.Element {
  const title = 'No results found'
  return <ZeroStateBase title={title} message={message} />
}

function ZeroStateSomethingWentWrong(): JSX.Element {
  const title = 'Oops! Something went wrong'
  return <ZeroStateBase title={title} message={'Please try again later'} />
}

function ZeroStateComingSoon(): JSX.Element {
  return <ZeroStateBase title={'Coming soon!'} />
}

function ZeroStateNoTransactions(): JSX.Element {
  const title = 'No recent activity'
  const message = 'New transactions will show here'

  return <ZeroStateBase title={title} message={message} />
}

function ZeroStateNoWatchlistFavorites({
  exploreAllTokens
}: {
  exploreAllTokens?: () => void
}): JSX.Element {
  const title = 'No Favorites'
  const message = 'Click the star icon on any token to mark it as a favorite.'

  return (
    <ZeroStateBase
      title={title}
      message={message}
      image={<StarSVG size={60} testID="star_svg" />}
      button={
        <AvaButton.SecondaryLarge onPress={exploreAllTokens}>
          Explore all tokens
        </AvaButton.SecondaryLarge>
      }
    />
  )
}

function ZeroStateNoContacts({
  addContact
}: {
  addContact: () => void
}): JSX.Element {
  const title = 'No Addresses Saved'
  const message = 'Tap the button below to add an address.'
  const button = (
    <AvaButton.SecondaryMedium
      style={{ width: '100%' }}
      textStyle={{ fontSize: 16 }}
      onPress={addContact}>
      Add Address
    </AvaButton.SecondaryMedium>
  )
  return (
    <ZeroStateBase
      title={title}
      message={message}
      image={<PersonSVG />}
      button={button}
    />
  )
}

function ZeroStateSites({
  onAddNewConnection
}: {
  onAddNewConnection: () => void
}): JSX.Element {
  const title = 'No Connected Sites'
  const message = 'Tap the button below to scan QR code and connect.'

  return (
    <ZeroStateBase
      title={title}
      message={message}
      image={<QRScanSVG size={54} />}
      button={
        <>
          <AvaButton.SecondaryLarge
            style={{ bottom: 32, position: 'absolute' }}
            onPress={onAddNewConnection}>
            Add New Connection
          </AvaButton.SecondaryLarge>
        </>
      }
    />
  )
}

const ZeroState = {
  Basic: ZeroStateBase,
  NetworkTokens: ZeroStateNetworkTokens,
  Collectibles: ZeroStateCollectibles,
  NoResultsTextual: ZeroStateNoResults,
  NoRecentAccounts: ZeroStateNoRecentAccounts,
  ComingSoon: ZeroStateComingSoon,
  NoTransactions: ZeroStateNoTransactions,
  NoWatchlistFavorites: ZeroStateNoWatchlistFavorites,
  EmptyAddressBook: ZeroStateEmptyAddressBook, // used in Send screens
  NoContacts: ZeroStateNoContacts, // used in Contacts screen
  Sites: ZeroStateSites,
  SomethingWentWrong: ZeroStateSomethingWentWrong
}

export default ZeroState
