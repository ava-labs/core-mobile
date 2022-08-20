import React, { FC, useEffect, useState } from 'react'
import { FlatList, Modal, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from 'components/Avatar'
import AvaButton from 'components/AvaButton'
import { IWalletConnectSession } from '@walletconnect/types'
import AvaListItem from 'components/AvaListItem'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import Logger from 'utils/Logger'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import { DeepLinkOrigin } from 'services/walletconnect/types'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { useApplicationContext } from 'contexts/ApplicationContext'
import QRCodeScanner from 'react-native-qrcode-scanner'
import DeleteSVG from 'components/svg/DeleteSVG'

interface Props {
  goBack: () => void
}

const ConnectedDapps: FC<Props> = ({ goBack }) => {
  const [uri, setUri] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const { setPendingDeepLink } = useDappConnectionContext()
  const theme = useApplicationContext().theme
  const [connectedDappsSessions, setConnectedDappSessions] = useState<
    { session: IWalletConnectSession; killSession: () => Promise<void> }[]
  >([])
  const [refreshing, setRefreshing] = useState(false)

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

  async function handleDeleteAll() {
    await walletConnectService.killAllSessions()
    refresh()
  }

  function handleAdd() {
    setShowModal(true)
  }

  function handleConnect() {
    setPendingDeepLink({
      url: uri,
      origin: DeepLinkOrigin.ORIGIN_QR_CODE
    })
    setShowModal(false)
    goBack()
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, marginHorizontal: 16 }}>
      <FlatList
        ListHeaderComponent={() => (
          <Row
            style={{
              justifyContent: __DEV__ ? 'space-between' : 'center',
              marginTop: 16
            }}>
            <AvaButton.SecondaryMedium onPress={handleDeleteAll}>
              Disconnect all
            </AvaButton.SecondaryMedium>
            {__DEV__ && (
              <>
                <Space x={16} />
                <AvaButton.SecondaryMedium onPress={handleAdd}>
                  Add
                </AvaButton.SecondaryMedium>
              </>
            )}
          </Row>
        )}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={{ flex: 1 }}
        data={connectedDappsSessions}
        renderItem={({ item, index }) => renderConnection(item, index, refresh)}
      />
      <Modal
        transparent
        visible={showModal}
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modal, { backgroundColor: theme.colorBg2 }]}>
            <QRCodeScanner
              bottomContent={
                <>
                  <InputText
                    text={uri}
                    onChangeText={setUri}
                    style={{ minWidth: 300 }}
                    placeholder={'WalletConnect URI'}
                  />
                  <Row>
                    <AvaButton.SecondaryMedium
                      onPress={() => {
                        setShowModal(false)
                      }}>
                      Cancel
                    </AvaButton.SecondaryMedium>
                    <Space x={16} />
                    <AvaButton.SecondaryMedium onPress={handleConnect}>
                      Connect
                    </AvaButton.SecondaryMedium>
                  </Row>
                </>
              }
              onRead={event => setUri(event.data)}
            />
          </View>
        </View>
      </Modal>
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
        <AvaButton.Base onPress={killSession}>
          <DeleteSVG size={24} />
        </AvaButton.Base>
      }
      rightComponentVerticalAlignment={'center'}
    />
  ) : null
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1
  }
})

export default ConnectedDapps
