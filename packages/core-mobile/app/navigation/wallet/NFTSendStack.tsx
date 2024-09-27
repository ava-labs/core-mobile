import React, { useMemo } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useNavigation, useRoute } from '@react-navigation/native'
import NftSend from 'screens/nft/send/NftSend'
import {
  NFTDetailsScreenProps,
  NFTDetailsSendScreenProps
} from 'navigation/types'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { useSelector } from 'react-redux'
import { selectIsSendBlocked } from 'store/posthog'
import { NFTItem, NFTItemData } from 'store/nft'
import { NftTokenWithBalance, TokenType } from '@avalabs/vm-module-types'
import { isErc721 } from 'services/nft/utils'
import { SendContextProvider } from 'contexts/SendContext'

export type NFTSendStackParamList = {
  [AppNavigation.NftSend.Send]: { nft: NFTItem }
}

const NFTSendStack = createStackNavigator<NFTSendStackParamList>()

type NFTSendScreenProp = NFTDetailsScreenProps<typeof AppNavigation.Nft.Send>

export default function NFTSendScreenStack(): JSX.Element | null {
  const { params } = useRoute<NFTSendScreenProp['route']>()
  const item = params.nft
  const isSendBlocked = useSelector(selectIsSendBlocked)
  const { goBack } = useNavigation<NFTSendScreenProp['navigation']>()

  const sendToken = useMemo(() => mapTokenFromNFT(item), [item])

  if (item === undefined) return null

  return (
    <SendContextProvider initialToken={sendToken}>
      <NFTSendStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          title: '',
          headerBackTitleVisible: false,
          headerTitleAlign: 'center'
        }}>
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.Send}
          component={NftSendScreen}
          initialParams={{ nft: item }}
        />
      </NFTSendStack.Navigator>
      {isSendBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'NFT is currently under maintenance.  Service will resume shortly.'
          }
        />
      )}
    </SendContextProvider>
  )
}

type AddressPickNavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Send
>['navigation']

const NftSendScreen = (): JSX.Element => {
  const { navigate } = useNavigation<AddressPickNavigationProp>()

  return (
    <NftSend
      onOpenAddressBook={() => navigate(AppNavigation.Wallet.AddressBook)}
    />
  )
}

// TODO: after migrating vm-module's nft balance fetching, use the real values from the nft balance
// https://ava-labs.atlassian.net/browse/CP-9276
const mapTokenFromNFT = (nft: NFTItemData): NftTokenWithBalance => {
  return {
    tokenId: nft.tokenId,
    type: isErc721(nft) ? TokenType.ERC721 : TokenType.ERC1155,
    address: nft.address,
    logoUri: nft.metadata.imageUri ?? '',
    name: nft.metadata.name ?? '',
    symbol: isErc721(nft) ? nft.symbol : '',
    //unused but included to conform to NftTokenWithBalance
    balanceInCurrency: 0,
    balanceDisplayValue: '',
    balanceCurrencyDisplayValue: '',
    priceInCurrency: 0,
    description: '',
    marketCap: 0,
    change24: 0,
    vol24: 0,
    balance: 0n,
    logoSmall: '',
    collectionName: isErc721(nft) ? nft.name : nft.metadata.name ?? 'Unknown',
    tokenUri: ''
  }
}
