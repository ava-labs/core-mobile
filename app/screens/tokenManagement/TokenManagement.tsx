import React from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  Text,
  View
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
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
import { TokenWithBalance } from 'store/balance'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.TokenManagement
>['navigation']

function TokenManagement(): JSX.Element {
  const { filteredTokenList, searchText, setSearchText, loadTokenList } =
    useSearchableTokenList(false)

  const navigation = useNavigation<NavigationProp>()

  function handleRefresh() {
    loadTokenList()
  }

  const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
    const token = item.item
    const logoUri = token.logoUri
    const balance = !token.balance.isZero()
      ? `${token.balanceDisplayValue} ${token.symbol}`
      : undefined

    return (
      <TokenManagementItem
        id={token.id}
        balance={balance}
        name={token.name}
        symbol={token.symbol}
        position={item.index + 1}
        image={logoUri}
      />
    )
  }

  const emptyView = (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        marginTop: 32
      }}>
      <AvaLogoSVG />
      <Text style={{ fontSize: 24, paddingTop: 32, textAlign: 'center' }}>
        There are no results. Please try another search
      </Text>
    </View>
  )

  const handleSearch = (text: string) => {
    setSearchText(text)
  }

  const descriptionPadding = Platform.OS === 'ios' ? 24 : 32

  return (
    <View style={{ flex: 1 }}>
      <AvaText.Body1
        textStyle={{ alignSelf: 'center', paddingStart: descriptionPadding }}>
        Add or remove tokens without balance
      </AvaText.Body1>
      <View style={{ marginHorizontal: 16 }}>
        <SearchBar onTextChanged={handleSearch} searchText={searchText} />
      </View>
      {!filteredTokenList ? (
        <Loader />
      ) : (
        <FlatList
          data={filteredTokenList}
          renderItem={renderItem}
          onRefresh={handleRefresh}
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
          keyExtractor={(item: TokenWithBalance) => item.id}
          ListEmptyComponent={emptyView}
        />
      )}
    </View>
  )
}

// not currently in use due to lack of SKD support
const AddCustomTokenButton = ({ onPress }: { onPress: () => void }) => {
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
