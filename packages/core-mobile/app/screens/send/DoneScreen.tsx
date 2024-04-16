import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import LinkSVG from 'components/svg/LinkSVG'
import { Space } from 'components/Space'
import ClearSVG from 'components/svg/ClearSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'
import { useNetworks } from 'hooks/networks/useNetworks'

interface DoneProps {
  transactionId: string
  onClose: () => void
}

export default function DoneScreen({
  onClose,
  transactionId
}: DoneProps): JSX.Element {
  const { activeNetwork } = useNetworks()
  const theme = useApplicationContext().theme
  const { openUrl } = useInAppBrowser()

  return (
    <View style={{ flex: 1 }}>
      <AvaButton.Icon style={styles.topClose} onPress={onClose}>
        <ClearSVG
          color={theme.colorIcon1}
          backgroundColor={theme.colorBg2}
          size={40}
        />
      </AvaButton.Icon>
      <View style={styles.container}>
        <AvaText.Heading1
          textStyle={{
            alignSelf: 'center'
          }}>
          Asset sent
        </AvaText.Heading1>
        <Space y={100} />
        <View style={styles.link}>
          <LinkSVG />
          <AvaButton.TextLarge
            onPress={() => {
              openUrl(getExplorerAddressByNetwork(activeNetwork, transactionId))
            }}>
            View on Explorer
          </AvaButton.TextLarge>
        </View>
        <AvaButton.PrimaryLarge style={{ margin: 18 }} onPress={onClose}>
          Done
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    bottom: 0,
    left: -10,
    right: 0,
    zIndex: 0,
    elevation: 0
  },
  topClose: { alignSelf: 'flex-end' },
  container: { flex: 1, justifyContent: 'flex-end' },
  link: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12
  }
})
