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
import NavigationBarButton from 'common/components/NavigationBarButton'
import { isIOS26AndAbove } from 'common/utils/isIOS26AndAbove'

const ConnectedSitesScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { allApprovedDapps, killDapp, killAllDapps } = useConnectedDapps()
  const [searchText, setSearchText] = useState('')

  const disconnectDapp = useCallback(
    async (dapp: Dapp): Promise<void> => {
      killDapp(dapp)
    },
    [killDapp]
  )

  const disconnectAll = useCallback(() => {
    showAlert({
      title: 'Disconnect all sites',
      description: 'Are you sure you want to disconnect all sites?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => killAllDapps()
        }
      ]
    })
  }, [killAllDapps])

  const getDappDisplay = useCallback(
    (
      dapp: Dapp
    ): {
      name: string
      url: string
      peerMeta: {
        name: string
        description: string
        url: string
        icons: string[]
      }
    } => {
      if (dapp.kind === 'wc') {
        const { name, url } = dapp.session.peer.metadata
        return { name, url, peerMeta: dapp.session.peer.metadata }
      }
      return {
        name: dapp.domain,
        url: dapp.domain,
        peerMeta: {
          name: dapp.domain,
          description: '',
          url: dapp.domain,
          icons: []
        }
      }
    },
    []
  )

  const searchResults = useMemo(() => {
    if (searchText === '') {
      return allApprovedDapps
    }
    const q = searchText.toLowerCase()
    return allApprovedDapps.filter(dapp => {
      const { name, url } = getDappDisplay(dapp)
      return name.toLowerCase().includes(q) || url.toLowerCase().includes(q)
    })
  }, [allApprovedDapps, searchText, getDappDisplay])

  const renderItem = useCallback(
    (item: Dapp): React.JSX.Element => {
      const { name, url, peerMeta } = getDappDisplay(item)
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
            <DappLogo peerMeta={peerMeta} size={32} />
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
              onPress={() => disconnectDapp(item)}
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
              <Text testID={`disconnect__${name}`} variant="buttonSmall">
                Disconnect
              </Text>
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
            onPress={() => disconnectDapp(item)}
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
      disconnectDapp,
      getDappDisplay
    ]
  )

  const renderSeparator = (): JSX.Element => <View sx={{ height: 12 }} />

  const renderHeaderRight = (): JSX.Element | null => {
    if (allApprovedDapps.length === 0) return null
    if (isIOS26AndAbove)
      return (
        <TouchableOpacity
          onPress={disconnectAll}
          style={{
            paddingHorizontal: 10
          }}>
          <Text variant="buttonSmall">Disconnect all</Text>
        </TouchableOpacity>
      )
    return (
      <NavigationBarButton>
        <Button size="small" onPress={disconnectAll} type="secondary">
          Disconnect all
        </Button>
      </NavigationBarButton>
    )
  }

  const renderHeader = useCallback(() => {
    return (
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        placeholder="Search"
        useDebounce={true}
      />
    )
  }, [searchText])

  const renderEmpty = useCallback(() => {
    return <ErrorState sx={{ flex: 1 }} title="No site found" description="" />
  }, [])

  return (
    <ListScreen
      isModal
      showNavigationHeaderTitle={false}
      title="Connected sites"
      ItemSeparatorComponent={renderSeparator}
      renderItem={item => renderItem(item.item as Dapp)}
      renderHeader={renderHeader}
      renderHeaderRight={renderHeaderRight}
      data={searchResults}
      keyExtractor={(item): string => (item as Dapp).id}
      renderEmpty={renderEmpty}
    />
  )
}

export default ConnectedSitesScreen
