import React, {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import { FlatList, ListRenderItemInfo, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AvaButton from 'components/AvaButton'
import AvaListItem from 'components/AvaListItem'
import { Space } from 'components/Space'
import ZeroState from 'components/ZeroState'
import AddSVG from 'components/svg/AddSVG'
import Separator from 'components/Separator'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { SecurityPrivacyScreenProps } from 'navigation/types'
import AvaText from 'components/AvaText'
import { Checkbox } from 'components/Checkbox'
import { useApplicationContext } from 'contexts/ApplicationContext'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { Session } from 'services/walletconnectv2/types'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { SessionTypes } from '@walletconnect/types'
import Logger from 'utils/Logger'
import { WalletConnectVersions } from 'store/walletConnectV2/types'
import { Dapp } from './types'
import { DappItem } from './DappItem'

interface Props {
  goBack: () => void
}

type NavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.QRCode
>['navigation']

const GET_DAPPS_V2_INTERVAL = 5000 // 5s

const ConnectedDapps: FC<Props> = ({ goBack }) => {
  const { setPendingDeepLink } = useDeeplink()
  const [isEditing, setIsEditing] = useState(false)
  const [allSelected, setAllSelected] = useState(false)
  const [dappsToRemove, setDappsToRemove] = useState<Dapp[]>([])
  const navigation = useNavigation<NavigationProp>()
  const theme = useApplicationContext().theme

  const { killSessions: killSessionsV2 } = useDappConnectionV2()
  const [approvedDappsV2, setApprovedDappsV2] = useState<SessionTypes.Struct[]>(
    []
  )

  const allApprovedDapps = approvedDappsV2.map<Dapp>(dapp => ({
    id: dapp.topic,
    dapp: dapp,
    version: WalletConnectVersions.V2
  }))

  useEffect(() => {
    const getSessions = (): void => {
      try {
        const sessions = WalletConnectService.getSessions()
        setApprovedDappsV2(sessions)
      } catch (err) {
        Logger.error('failed to get sessions', err)
      }
    }

    // immediately fetch sessions onMounting
    // then do it periodically while on this screen
    getSessions()

    const id = setInterval(() => {
      getSessions()
    }, GET_DAPPS_V2_INTERVAL)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const beforeBackListener = navigation.addListener('beforeRemove', e => {
      e.preventDefault()

      if (isEditing) {
        setIsEditing(false)
        setAllSelected(false)
        if (dappsToRemove.length > 0) {
          setDappsToRemove([])
        }
      } else {
        navigation.dispatch(e.data.action)
      }
    })

    return () => {
      navigation.removeListener('beforeRemove', beforeBackListener)
    }
  }, [isEditing, navigation, dappsToRemove, setDappsToRemove])

  const getHeaderTitle = useCallback(() => {
    return (
      <AvaText.Heading1>
        {isEditing ? `${dappsToRemove.length} Selected` : ''}
      </AvaText.Heading1>
    )
  }, [isEditing, dappsToRemove.length])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: getHeaderTitle
    })
  }, [getHeaderTitle, navigation])

  async function handleDelete(): Promise<void> {
    const dappsV2ToRemove: Session[] = []

    for (const item of dappsToRemove) {
      dappsV2ToRemove.push(item.dapp)
    }

    setIsEditing(false)
    setDappsToRemove([])

    killSessionsV2(dappsV2ToRemove)
    setApprovedDappsV2(dapps =>
      dapps.filter(dapp =>
        dappsV2ToRemove.some(dappToRemove => dappToRemove.topic !== dapp.topic)
      )
    )
  }

  function handleSelect(item: Dapp): void {
    setDappsToRemove(current => {
      if (current.some(it => it.id === item.id)) {
        return current.filter(it => it.id !== item.id)
      }

      return [...current, item]
    })
  }

  function handleAdd(): void {
    navigation.navigate(AppNavigation.SecurityPrivacy.QRCode, {
      onScanned: handleConnect
    })
  }

  function handleConnect(uri: string): void {
    setPendingDeepLink({
      url: uri,
      origin: DeepLinkOrigin.ORIGIN_QR_CODE
    })
    goBack()
  }

  function handleSelectAll(): void {
    setAllSelected(currentState => {
      const newState = !currentState
      if (newState) {
        setDappsToRemove(allApprovedDapps)
      } else {
        setDappsToRemove([])
      }
      return newState
    })
  }

  const handleClear = async (item: Dapp): Promise<void> => {
    killSessionsV2([item.dapp])
    setApprovedDappsV2(dapps =>
      dapps.filter(dapp => dapp.topic !== item.dapp.topic)
    )
  }

  const renderItem = (item: ListRenderItemInfo<Dapp>): JSX.Element => {
    const selected = dappsToRemove.some(dapp => dapp.id === item.item.id)

    return (
      <DappItem
        item={item.item}
        isEditing={isEditing}
        onClear={handleClear}
        onSelect={handleSelect}
        selected={selected}
      />
    )
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
          allApprovedDapps.length > 0 ? (
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
        contentContainerStyle={{ flexGrow: 1 }}
        data={allApprovedDapps}
        renderItem={renderItem}
      />
      {isEditing && (
        <View>
          <AvaButton.PrimaryLarge
            disabled={dappsToRemove.length === 0}
            style={{ marginHorizontal: 16 }}
            textColor={theme.colorError}
            onPress={handleDelete}>
            Delete
          </AvaButton.PrimaryLarge>
          <Space y={24} />
        </View>
      )}
    </SafeAreaView>
  )
}

export default ConnectedDapps
