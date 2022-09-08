import React, { FC, useEffect, useLayoutEffect, useState } from 'react'
import { FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AvaButton from 'components/AvaButton'
import { IWalletConnectSession } from '@walletconnect/types'
import AvaListItem from 'components/AvaListItem'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import Logger from 'utils/Logger'
import { Space } from 'components/Space'
import { DeepLinkOrigin } from 'services/walletconnect/types'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import ZeroState from 'components/ZeroState'
import AddSVG from 'components/svg/AddSVG'
import Separator from 'components/Separator'
import ClearSVG from 'components/svg/ClearSVG'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { SecurityPrivacyScreenProps } from 'navigation/types'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { Checkbox } from 'components/Checkbox'
import { Row } from 'components/Row'
import FlexSpacer from 'components/FlexSpacer'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  goBack: () => void
}

type NavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.QRCode
>['navigation']

type SessionItem = {
  session: IWalletConnectSession
  killSession: () => Promise<void>
}

const ConnectedDapps: FC<Props> = ({ goBack }) => {
  const { setPendingDeepLink } = useDappConnectionContext()
  const [isEditing, setIsEditing] = useState(false)
  const [allSelected, setAllSelected] = useState(false)
  const [sessionsToRemove, setSessionsToRemove] = useState<SessionItem[]>([])
  const [connectedDappsSessions, setConnectedDappSessions] = useState<
    SessionItem[]
  >([])
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation<NavigationProp>()
  const theme = useApplicationContext().theme

  useEffect(() => {
    const beforeBackListener = navigation.addListener('beforeRemove', e => {
      e.preventDefault()

      if (isEditing) {
        setIsEditing(false)
        setAllSelected(false)
        if (sessionsToRemove.length > 0) {
          setSessionsToRemove([])
        }
      } else {
        navigation.dispatch(e.data.action)
      }
    })

    return () => {
      navigation.removeListener('beforeRemove', beforeBackListener)
    }
  }, [isEditing, sessionsToRemove, setSessionsToRemove])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <AvaText.Heading1>
          {isEditing ? `${sessionsToRemove.length} Selected` : ''}
        </AvaText.Heading1>
      )
    })
  }, [isEditing, sessionsToRemove])

  function refresh() {
    setRefreshing(true)
    try {
      const sessions = walletConnectService.getConnections()
      setConnectedDappSessions(sessions)
    } catch (e) {
      Logger.error('error loading sessions', e)
    }
    setRefreshing(false)
  }

  async function handleDelete() {
    for (const session of sessionsToRemove) {
      await session.killSession()
    }
    setIsEditing(false)
    setSessionsToRemove([])
    refresh()
  }

  useEffect(() => {
    if (isEditing && allSelected) {
      setSessionsToRemove(connectedDappsSessions)
    } else if (isEditing) {
      setSessionsToRemove([])
    }
  }, [allSelected, isEditing])

  function handleSelect(item: {
    session: IWalletConnectSession
    killSession: () => Promise<void>
  }) {
    if (
      sessionsToRemove?.some(it => it.session.peerId === item.session.peerId)
    ) {
      const removed = sessionsToRemove?.filter(
        it => it.session.peerId !== item.session.peerId
      )
      setSessionsToRemove(removed)
    } else {
      setSessionsToRemove([...sessionsToRemove, item])
    }
  }

  function handleAdd() {
    navigation.navigate(AppNavigation.SecurityPrivacy.QRCode, {
      onScanned: handleConnect
    })
  }

  function handleConnect(uri: string) {
    setPendingDeepLink({
      url: uri,
      origin: DeepLinkOrigin.ORIGIN_QR_CODE
    })
    goBack()
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {isEditing || (
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
          Connected Sites
        </AvaText.LargeTitleBold>
      )}
      <Space y={32} />
      <FlatList
        ListHeaderComponent={
          connectedDappsSessions.length > 0 ? (
            <>
              {isEditing ? (
                <AvaListItem.Base
                  leftComponent={
                    <Checkbox
                      selected={allSelected}
                      onPress={() => setAllSelected(!allSelected)}
                    />
                  }
                  title={'Select all'}
                  rightComponentVerticalAlignment={'center'}
                />
              ) : (
                <>
                  <AvaListItem.Base
                    key={'manage'}
                    onPress={handleAdd}
                    leftComponent={<AddSVG size={40} />}
                    title={'Connect to new site'}
                    rightComponent={
                      <AvaButton.TextMedium onPress={() => setIsEditing(true)}>
                        Manage
                      </AvaButton.TextMedium>
                    }
                    rightComponentVerticalAlignment={'center'}
                  />
                  <Separator />
                </>
              )}
            </>
          ) : null
        }
        ListEmptyComponent={<ZeroState.Sites onAddNewConnection={handleAdd} />}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={{ flex: 1 }}
        data={connectedDappsSessions}
        renderItem={({ item, index }) => (
          <ConnectionListItem
            item={item}
            index={index}
            isEditing={isEditing}
            refresh={refresh}
            onSelect={handleSelect}
            selected={sessionsToRemove?.some(
              it => it.session.peerId === item.session.peerId
            )}
          />
        )}
      />
      {isEditing && (
        <>
          <FlexSpacer />
          <AvaButton.PrimaryLarge
            disabled={sessionsToRemove.length === 0}
            style={{ marginHorizontal: 16 }}
            textColor={theme.colorError}
            onPress={handleDelete}>
            Delete
          </AvaButton.PrimaryLarge>
          <Space y={75} />
        </>
      )}
    </SafeAreaView>
  )
}

interface ListItemProps {
  item: SessionItem
  index: number
  isEditing: boolean
  refresh: () => void
  onSelect: (item: SessionItem) => void
  selected: boolean
}

export function ConnectionListItem({
  item,
  index,
  isEditing,
  refresh,
  onSelect,
  selected
}: ListItemProps) {
  const theme = useApplicationContext().theme

  async function killSession() {
    await item.killSession()
    refresh()
  }

  const peerMeta = item?.session?.peerMeta
  const iconCount = peerMeta?.icons?.length ?? 0

  // try to get the icon with the highest resolution
  const iconUrl =
    iconCount > 2
      ? peerMeta?.icons[2]
      : iconCount > 1
      ? peerMeta?.icons[1]
      : iconCount === 1
      ? peerMeta?.icons[0]
      : undefined

  const url = item?.session?.peerMeta?.url
    ?.replace(/^https?:\/\//, '')
    ?.replace('www.', '')

  Logger.warn(`iconUrl: ${iconUrl}`)

  return item?.session ? (
    <AvaListItem.Base
      key={index}
      leftComponent={
        <Row style={{ alignItems: 'center' }}>
          {isEditing && (
            <>
              <Checkbox selected={selected} onPress={() => onSelect(item)} />
              <Space x={16} />
            </>
          )}
          <Avatar.Custom
            name={item.session?.peerMeta?.name ?? 'Unknown'}
            logoUri={iconUrl}
          />
        </Row>
      }
      title={url ?? 'unknown'}
      rightComponent={
        isEditing ? null : (
          <AvaButton.Base onPress={killSession}>
            <ClearSVG color={theme.white} backgroundColor={theme.background} />
          </AvaButton.Base>
        )
      }
      rightComponentVerticalAlignment={'center'}
    />
  ) : null
}

export default ConnectedDapps
