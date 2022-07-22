import React, { FC, useEffect, useState } from 'react'
import { FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from 'components/Avatar'
import AvaButton from 'components/AvaButton'
import { IWalletConnectSession } from '@walletconnect/types'
import TrashSVG from 'components/svg/TrashSVG'
import AvaListItem from 'components/AvaListItem'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import Logger from 'utils/Logger'

const ConnectedDapps: FC = () => {
  const [connectedDappsSessions, setConnectedDappSessions] = useState<
    { session: IWalletConnectSession; killSession: () => Promise<void> }[]
  >([])
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    try {
      const sessions = walletConnectService.getConnections()
      setConnectedDappSessions(sessions)
    } catch (e) {
      Logger.error('error loading sessions', e)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AvaButton.PrimaryMedium
        onPress={() => {
          walletConnectService.killAllSessions()
        }}>
        Delete All Sessions
      </AvaButton.PrimaryMedium>
      <FlatList
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

  return item?.session ? (
    <AvaListItem.Base
      key={index}
      leftComponent={
        <Avatar.Custom
          name={item.session?.peerMeta?.name ?? 'Unknown'}
          logoUri={item.session?.peerMeta?.icons?.[0] ?? undefined}
        />
      }
      title={item?.session?.peerMeta?.name ?? 'Unknown'}
      rightComponent={
        <AvaButton.Icon onPress={killSession}>
          <TrashSVG size={32} />
        </AvaButton.Icon>
      }
      rightComponentHorizontalAlignment={'flex-end'}
      rightComponentVerticalAlignment={'center'}
    />
  ) : null
}

export default ConnectedDapps
