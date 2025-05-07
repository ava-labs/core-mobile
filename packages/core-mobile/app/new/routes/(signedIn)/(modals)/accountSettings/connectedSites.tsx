import {
  Button,
  SearchBar,
  showAlert,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListScreen } from 'common/components/ListScreen'
import {
  Dapp,
  useConnectedDapps
} from 'features/accountSettings/hooks/useConnectedDapps'
import React, { useCallback, useMemo, useState } from 'react'
import { DappLogo } from 'common/components/DappLogo'
import { ErrorState } from 'common/components/ErrorState'

const ConnectedSitesScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { allApprovedDapps, killSession, killAllSessions } = useConnectedDapps()
  const [searchText, setSearchText] = useState('')

  const navigationTitle = `${allApprovedDapps.length} connected ${
    allApprovedDapps.length < 2 ? 'site' : 'sites'
  }`

  const disconnectDapp = useCallback(
    async (topic: string): Promise<void> => {
      killSession(topic)
    },
    [killSession]
  )

  const disconnectAll = useCallback(() => {
    showAlert({
      title: 'Disconnect all sites',
      description: 'Are you sure you want to disconnect all sites?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => killAllSessions()
        }
      ]
    })
  }, [killAllSessions])

  const searchResults = useMemo(() => {
    if (searchText === '') {
      return allApprovedDapps
    }
    return allApprovedDapps.filter(
      dapp =>
        dapp.dapp.peer.metadata.name
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        dapp.dapp.peer.metadata.url
          .toLowerCase()
          .includes(searchText.toLowerCase())
    )
  }, [allApprovedDapps, searchText])

  const renderItem = useCallback(
    (item: Dapp): React.JSX.Element => {
      const { name, url } = item.dapp.peer.metadata
      return (
        <View
          sx={{
            marginHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            backgroundColor: colors.$surfaceSecondary
          }}>
          <View
            sx={{
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              backgroundColor: colors.$surfaceSecondary
            }}>
            <DappLogo peerMeta={item.dapp.peer.metadata} size={32} />
            <View
              sx={{
                flex: 1,
                marginHorizontal: 12
              }}>
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ fontSize: 16, lineHeight: 16, flexGrow: 1 }}>
                {name}
              </Text>
              <Text
                variant="body2"
                sx={{ lineHeight: 16, color: colors.$textSecondary }}
                ellipsizeMode="tail"
                numberOfLines={1}>
                {url}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => disconnectDapp(item.dapp.topic)}
              sx={{
                width: 100,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.$borderPrimary,
                height: 27,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5
              }}>
              <Text variant="buttonSmall">Disconnect</Text>
            </TouchableOpacity>
          </View>
          <View
            sx={{
              flex: 1,
              marginHorizontal: 12
            }}>
            <Text
              variant="buttonMedium"
              numberOfLines={1}
              ellipsizeMode="tail"
              sx={{ fontSize: 16, lineHeight: 16, flexGrow: 1 }}>
              {name}
            </Text>
            <Text
              variant="body2"
              sx={{ lineHeight: 16, color: colors.$textSecondary }}
              ellipsizeMode="tail"
              numberOfLines={1}>
              {url}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => disconnectDapp(item.dapp.topic)}
            sx={{
              width: 100,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.$borderPrimary,
              height: 27,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5
            }}>
            <Text variant="buttonSmall">Disconnect</Text>
          </TouchableOpacity>
        </View>
      )
    },
    [
      colors.$borderPrimary,
      colors.$surfaceSecondary,
      colors.$textSecondary,
      disconnectDapp
    ]
  )

  const renderSeparator = (): JSX.Element => <View sx={{ height: 12 }} />

  const renderHeader = useCallback(() => {
    return (
      <View sx={{ gap: 24, alignItems: 'flex-end' }}>
        <SearchBar
          onTextChanged={setSearchText}
          searchText={searchText}
          placeholder="Search"
          useDebounce={true}
        />
        {allApprovedDapps.length ? (
          <View>
            <Button size="small" onPress={disconnectAll} type="secondary">
              Disconnect all
            </Button>
          </View>
        ) : null}
      </View>
    )
  }, [allApprovedDapps.length, disconnectAll, searchText])

  const renderEmpty = useCallback(() => {
    return <ErrorState sx={{ flex: 1 }} title="No site found" description="" />
  }, [])

  return (
    <ListScreen
      isModal
      title={navigationTitle}
      ItemSeparatorComponent={renderSeparator}
      renderItem={item => renderItem(item.item as Dapp)}
      renderHeader={renderHeader}
      data={searchResults}
      keyExtractor={(item): string => (item as Dapp).id}
      renderEmpty={renderEmpty}
    />
  )
}

export default ConnectedSitesScreen
