import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import React, { useMemo, useState, useEffect } from 'react'
import {
  CircularButton,
  Icons,
  ScrollView,
  TouchableOpacity,
  Image,
  CIRCULAR_BUTTON_WIDTH,
  Text,
  View
} from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as SMS from 'expo-sms'
import Logger from 'utils/Logger'
import { Social } from 'react-native-share'

export const ShareFooter = ({
  url,
  onCopyLink,
  onMore,
  onSendMessage,
  onShare
}: {
  url?: string
  onCopyLink: (link: string | undefined) => void
  onMore: () => void
  onSendMessage: () => void
  onShare: (social: AvailableSocial) => void
}): JSX.Element | null => {
  const { bottom } = useSafeAreaInsets()
  const [canSendSMS, setCanSendSMS] = useState(false)

  const actions = useMemo(() => {
    const result = [
      <CircularButton title="More" key="more" onPress={onMore}>
        <Icons.Navigation.MoreHoriz />
      </CircularButton>
    ]
    if (url) {
      result.unshift(
        <CircularButton
          title="Copy link"
          key="copy-link"
          onPress={() => onCopyLink(url)}>
          <Icons.Content.Link style={{ transform: [{ rotate: '-45deg' }] }} />
        </CircularButton>
      )
    }

    if (canSendSMS) {
      result.push(
        <ActionButton
          onPress={onSendMessage}
          title="Messages"
          key="send-message">
          <Image
            source={require('../../../assets/icons/message.png')}
            sx={{ width: CIRCULAR_BUTTON_WIDTH, height: CIRCULAR_BUTTON_WIDTH }}
          />
        </ActionButton>
      )
    }

    const socials: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon: any
      type: AvailableSocial
      title: string
      key: string
    }[] = [
      {
        icon: require('../../../assets/icons/x.png'),
        type: Social.Twitter,
        title: 'X',
        key: 'x'
      },
      {
        icon: require('../../../assets/icons/instagram.png'),
        type: Social.Instagram,
        title: 'Instagram',
        key: 'instagram'
      },
      {
        icon: require('../../../assets/icons/messenger.png'),
        type: Social.Messenger,
        title: 'Messenger',
        key: 'messenger'
      },
      {
        icon: require('../../../assets/icons/whatsapp.png'),
        type: Social.Whatsapp,
        title: 'WhatsApp',
        key: 'whatsapp'
      },
      {
        icon: require('../../../assets/icons/telegram.png'),
        type: Social.Telegram,
        title: 'Telegram',
        key: 'telegram'
      }
    ]
    socials.forEach(({ icon, type, title, key }) => {
      result.push(
        <ActionButton onPress={() => onShare(type)} title={title} key={key}>
          <Image
            source={icon}
            sx={{ width: CIRCULAR_BUTTON_WIDTH, height: CIRCULAR_BUTTON_WIDTH }}
          />
        </ActionButton>
      )
    })

    return result
  }, [onMore, onCopyLink, onSendMessage, url, canSendSMS, onShare])

  useEffect(() => {
    SMS.isAvailableAsync()
      .then(result => setCanSendSMS(result))
      .catch(Logger.error)
  }, [])

  if (actions.length === 0) {
    return null
  }

  return (
    <LinearGradientBottomWrapper>
      <ScrollView
        sx={{
          paddingBottom: bottom + 12,
          flexDirection: 'row'
        }}
        contentContainerSx={{ paddingHorizontal: 28, gap: 20 }}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {actions}
      </ScrollView>
    </LinearGradientBottomWrapper>
  )
}

const ActionButton: React.FC<{
  title?: string
  testID?: string
  onPress: () => void
  children: React.ReactNode
}> = ({ title, testID, onPress, children }): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress} accessible={false} testID={testID}>
      <View
        sx={{
          gap: 8,
          alignItems: 'center'
        }}>
        <View sx={{ borderRadius: 18, overflow: 'hidden' }}>{children}</View>
        {title && <Text variant="subtitle2">{title}</Text>}
      </View>
    </TouchableOpacity>
  )
}

export type AvailableSocial =
  | Social.Twitter
  | Social.Instagram
  | Social.Whatsapp
  | Social.Telegram
  | Social.Messenger
