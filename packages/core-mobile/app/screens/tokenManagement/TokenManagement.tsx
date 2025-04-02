import React from 'react'
import { FlatList, ListRenderItemInfo, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import TokenManagementItem from 'screens/tokenManagement/TokenManagementItem'
import AvaText from 'components/AvaText'
import AddSVG from 'components/svg/AddSVG'
import CarrotSVG from 'components/svg/CarrotSVG'
import AvaButton from 'components/AvaButton'
import { Opacity50 } from 'resources/Constants'
import Loader from 'components/Loader'
import SearchBar from 'components/SearchBar'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { LocalTokenWithBalance } from 'store/balance/types'
import ZeroState from 'components/ZeroState'
import { TokenType } from '@avalabs/vm-module-types'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.TokenManagement
>['navigation']

function TokenManagement(): JSX.Element {
  const { filteredTokenList, searchText, setSearchText, refetch } =
    useSearchableTokenList(true, false)

  // only show erc20 tokens here
  const tokenList = filteredTokenList.filter(
    token => token.type !== TokenType.NATIVE
  )

  const navigation = useNavigation<NavigationProp>()

  const renderItem = (
    item: ListRenderItemInfo<LocalTokenWithBalance>
  ): JSX.Element => {
    const token = item.item
    return <TokenManagementItem token={token} />
  }

  const emptyView = <ZeroState.Basic title="No results found" />

  const handleSearch = (text: string): void => {
    setSearchText(text)
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ marginHorizontal: 16 }}>
        <SearchBar onTextChanged={handleSearch} searchText={searchText} />
      </View>
      {!tokenList ? (
        <Loader />
      ) : (
        <FlatList
          data={tokenList}
          renderItem={renderItem}
          onRefresh={refetch}
          ListHeaderComponent={
            <View
              style={{ marginTop: 8, marginBottom: 16, marginHorizontal: 16 }}>
              <AddCustomTokenButton
                onPress={() =>
                  navigation.navigate(AppNavigation.Wallet.AddCustomToken)
                }
              />
            </View>
          }
          refreshing={false}
          keyExtractor={(item: LocalTokenWithBalance) => item.localId}
          ListEmptyComponent={emptyView}
        />
      )}
    </View>
  )
}

const AddCustomTokenButton = ({
  onPress
}: {
  onPress: () => void
}): JSX.Element => {
  const { theme } = useApplicationContext()
  return (
    <AvaButton.Base
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colorBg3 + Opacity50,
        borderRadius: 8,
        padding: 16
      }}>
      <AddSVG color={theme.colorPrimary1} hideCircle size={24} />
      <AvaText.Body1 textStyle={{ marginLeft: 12, flex: 1 }}>
        Add custom token
      </AvaText.Body1>
      <CarrotSVG />
    </AvaButton.Base>
  )
}

export default TokenManagement
