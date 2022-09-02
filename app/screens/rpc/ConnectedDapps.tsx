import React, { FC, useEffect, useState } from 'react'
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

interface Props {
  goBack: () => void
}

type NavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.QRCode
>['navigation']

const ConnectedDapps: FC<Props> = ({ goBack }) => {
  const { setPendingDeepLink } = useDappConnectionContext()
  const [connectedDappsSessions, setConnectedDappSessions] = useState<
    { session: IWalletConnectSession; killSession: () => Promise<void> }[]
  >([])
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation<NavigationProp>()

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

  // async function handleDeleteAll() {
  //   await walletConnectService.killAllSessions()
  //   refresh()
  // }

  function handleAdd() {
    navigation.navigate(AppNavigation.SecurityPrivacy.QRCode, {
      onAction: handleConnect,
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
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Connected Sites
      </AvaText.LargeTitleBold>
      <Space y={32} />
      <FlatList
        ListHeaderComponent={
          connectedDappsSessions.length > 0 ? (
            <>
              <AvaListItem.Base
                key={'manage'}
                onPress={handleAdd}
                leftComponent={<AddSVG size={40} />}
                title={'Connect to new site'}
                rightComponent={
                  <AvaButton.TextMedium onPress={() => console.log('manage')}>
                    Manage
                  </AvaButton.TextMedium>
                }
                rightComponentVerticalAlignment={'center'}
              />
              <Separator />
            </>
          ) : null
        }
        ListEmptyComponent={<ZeroState.Sites onAddNewConnection={handleAdd} />}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={{ flex: 1 }}
        data={connectedDappsSessions}
        renderItem={({ item, index }) => renderConnection(item, index, refresh)}
      />
    </SafeAreaView>
  )
}

function renderConnection(
  item: {
    session: IWalletConnectSession
    killSession: () => Promise<void>
  },
  index: number,
  refresh: () => void
) {
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
        <Avatar.Custom
          name={item.session?.peerMeta?.name ?? 'Unknown'}
          logoUri={iconUrl}
        />
      }
      title={url ?? 'unknown'}
      rightComponent={
        <AvaButton.Base onPress={killSession}>
          <ClearSVG color={'#FFFFFF'} backgroundColor={'#000000'} />
        </AvaButton.Base>
      }
      rightComponentVerticalAlignment={'center'}
    />
  ) : null
}

export default ConnectedDapps
