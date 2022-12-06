import React, {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import { FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AvaButton from 'components/AvaButton'
import AvaListItem from 'components/AvaListItem'
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
import { useSelector } from 'react-redux'
import { ApprovedAppMeta, selectApprovedDApps } from 'store/walletConnect'

interface Props {
  goBack: () => void
}

type NavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.QRCode
>['navigation']

const ConnectedDapps: FC<Props> = ({ goBack }) => {
  const { setPendingDeepLink, killSessions } = useDappConnectionContext()
  const [isEditing, setIsEditing] = useState(false)
  const [allSelected, setAllSelected] = useState(false)
  const [sessionsToRemove, setSessionsToRemove] = useState<ApprovedAppMeta[]>(
    []
  )
  const connectedDAppsSessions = useSelector(selectApprovedDApps)
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
  }, [isEditing, navigation, sessionsToRemove, setSessionsToRemove])

  const getHeaderTitle = useCallback(() => {
    return (
      <AvaText.Heading1>
        {isEditing ? `${sessionsToRemove.length} Selected` : ''}
      </AvaText.Heading1>
    )
  }, [isEditing, sessionsToRemove.length])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: getHeaderTitle
    })
  }, [getHeaderTitle, navigation])

  async function handleDelete() {
    killSessions(sessionsToRemove)
    setIsEditing(false)
    setSessionsToRemove([])
  }

  function handleSelect(item: ApprovedAppMeta) {
    if (sessionsToRemove?.some(it => it.peerId === item.peerId)) {
      const removed = sessionsToRemove?.filter(it => it.peerId !== item.peerId)
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

  function handleSelectAll() {
    setAllSelected(currentState => {
      const newState = !currentState
      if (newState) {
        setSessionsToRemove(connectedDAppsSessions)
      } else {
        setSessionsToRemove([])
      }
      return newState
    })
  }

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
          connectedDAppsSessions.length > 0 ? (
            <>
              {isEditing ? (
                <AvaListItem.Base
                  leftComponent={
                    <Checkbox
                      selected={allSelected}
                      onPress={handleSelectAll}
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
        contentContainerStyle={{ flex: 1 }}
        data={connectedDAppsSessions}
        renderItem={({ item, index }) => (
          <ConnectionListItem
            item={item}
            index={index}
            isEditing={isEditing}
            onSelect={handleSelect}
            selected={sessionsToRemove?.some(it => it.peerId === item.peerId)}
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
  item: ApprovedAppMeta
  index: number
  isEditing: boolean
  onSelect: (item: ApprovedAppMeta) => void
  selected: boolean
}

export function ConnectionListItem({
  item,
  index,
  isEditing,
  onSelect,
  selected
}: ListItemProps) {
  const theme = useApplicationContext().theme
  const { killSessions } = useDappConnectionContext()

  async function killSession() {
    killSessions([item])
  }

  const peerMeta = item.peerMeta
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

  const url = item.peerMeta?.url
    ?.replace(/^https?:\/\//, '')
    ?.replace('www.', '')

  Logger.warn(`iconUrl: ${iconUrl}`)

  return (
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
            name={item.peerMeta?.name ?? 'Unknown'}
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
  )
}

export default ConnectedDapps
