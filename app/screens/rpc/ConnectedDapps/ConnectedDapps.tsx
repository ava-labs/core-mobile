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
import { useSelector } from 'react-redux'
import { ApprovedAppMeta, selectApprovedDApps } from 'store/walletConnect'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { Session } from 'services/walletconnectv2/types'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useDappConnectionV1 } from 'hooks/useDappConnectionV1'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { WalletConnectVersions } from 'store/walletConnectV2'
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

  const { killSessions: killSessionsV1 } = useDappConnectionV1()
  const { killSessions: killSessionsV2 } = useDappConnectionV2()
  const approvedDappsV1 = useSelector(selectApprovedDApps)
  const [approvedDappsV2, setApprovedDappsV2] = useState(
    WalletConnectService.getSessions()
  )

  const allApprovedDapps = [
    ...approvedDappsV1.map<Dapp>(dapp => ({
      id: dapp.peerId,
      dapp,
      version: WalletConnectVersions.V1
    })),
    ...approvedDappsV2.map<Dapp>(dapp => ({
      id: dapp.topic,
      dapp: dapp,
      version: WalletConnectVersions.V2
    }))
  ]

  useEffect(() => {
    const id = setInterval(() => {
      setApprovedDappsV2(WalletConnectService.getSessions())
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

  async function handleDelete() {
    const dappsV2ToRemove: Session[] = [],
      dappsV1ToRemove: ApprovedAppMeta[] = []

    for (const item of dappsToRemove) {
      if (item.version === WalletConnectVersions.V2) {
        dappsV2ToRemove.push(item.dapp)
      }

      if (item.version === WalletConnectVersions.V1) {
        dappsV1ToRemove.push(item.dapp)
      }
    }

    setIsEditing(false)
    setDappsToRemove([])

    killSessionsV2(dappsV2ToRemove)
    setApprovedDappsV2(dapps =>
      dapps.filter(dapp =>
        dappsV2ToRemove.some(dappToRemove => dappToRemove.topic !== dapp.topic)
      )
    )

    killSessionsV1(dappsV1ToRemove)
  }

  function handleSelect(item: Dapp) {
    setDappsToRemove(current => {
      if (current.some(it => it.id === item.id)) {
        return current.filter(it => it.id !== item.id)
      }

      return [...current, item]
    })
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
        setDappsToRemove(allApprovedDapps)
      } else {
        setDappsToRemove([])
      }
      return newState
    })
  }

  const handleClear = async (item: Dapp) => {
    if (item.version === WalletConnectVersions.V1) {
      killSessionsV1([item.dapp])
    } else {
      killSessionsV2([item.dapp])
      setApprovedDappsV2(dapps =>
        dapps.filter(dapp => dapp.topic !== item.dapp.topic)
      )
    }
  }

  const renderItem = (item: ListRenderItemInfo<Dapp>) => {
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
