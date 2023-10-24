import { View } from 'react-native'
import { Space } from 'components/Space'
import React, { FC, useEffect, useState } from 'react'
import AvaText from 'components/AvaText'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import {
  BridgeTransactionStatusParams,
  WalletScreenProps
} from 'navigation/types'
import ActivityList from 'screens/shared/ActivityList/ActivityList'
import { TokenWithBalance } from 'store/balance'
import { Transaction } from 'store/transaction'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.OwnedTokenDetail
>

const OwnedTokenDetail: FC = () => {
  const { tokenId } = useRoute<ScreenProps['route']>().params
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { filteredTokenList } = useSearchableTokenList()
  const [token, setToken] = useState<TokenWithBalance>()
  const { capture } = usePostCapture()
  const activeNetwork = useSelector(selectActiveNetwork)

  useEffect(loadToken, [filteredTokenList, token, tokenId])

  const openTransactionDetails = (item: Transaction) => {
    return navigate(AppNavigation.Wallet.ActivityDetail, {
      tx: item
    })
  }

  const openTransactionStatus = (params: BridgeTransactionStatusParams) => {
    navigate(AppNavigation.Bridge.BridgeTransactionStatus, params)
  }

  function loadToken() {
    if (filteredTokenList && !token) {
      const result = filteredTokenList.filter(tk => tk.localId === tokenId)
      if (result.length > 0) {
        setToken(result[0])
      }
    }
  }

  const subtitle = (
    <Row style={{ alignItems: 'center' }}>
      <AvaText.Body1>{token?.balanceDisplayValue ?? '0'}</AvaText.Body1>
      <AvaText.Body2>{' ' + token?.symbol}</AvaText.Body2>
    </Row>
  )
  return (
    <View style={{ paddingHorizontal: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Token Details</AvaText.LargeTitleBold>
      <Space y={8} />
      <View style={{ marginHorizontal: -16 }}>
        <AvaListItem.Base
          title={<AvaText.Heading1>{token?.name}</AvaText.Heading1>}
          titleAlignment={'flex-start'}
          subtitle={subtitle}
          leftComponent={
            <Avatar.Custom
              name={token?.name ?? ''}
              symbol={token?.symbol}
              logoUri={token?.logoUri}
              size={40}
            />
          }
          rightComponent={
            <AvaText.Body1
              textStyle={{ marginTop: 4 }}
              currency
              ellipsizeMode={'tail'}>
              {token?.balanceCurrencyDisplayValue ?? '0'}
            </AvaText.Body1>
          }
        />
      </View>
      <Space y={16} />
      <Row>
        <View style={{ flex: 1 }}>
          <AvaButton.SecondaryMedium
            onPress={() => {
              capture('TokenReceiveClicked', { chainId: activeNetwork.chainId })
              navigate(AppNavigation.Wallet.ReceiveTokens)
            }}>
            Receive
          </AvaButton.SecondaryMedium>
        </View>
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <AvaButton.SecondaryMedium
            onPress={() => {
              capture('TokenSendClicked', { chainId: activeNetwork.chainId })
              navigate(AppNavigation.Wallet.SendTokens, {
                screen: AppNavigation.Send.Send,
                params: { token: token }
              })
            }}>
            Send
          </AvaButton.SecondaryMedium>
        </View>
      </Row>
      <Space y={24} />
      <AvaText.Heading2>Activity</AvaText.Heading2>
      <View style={{ marginHorizontal: -16, flex: 1 }}>
        <ActivityList
          tokenSymbolFilter={token?.symbol}
          openTransactionDetails={openTransactionDetails}
          openTransactionStatus={openTransactionStatus}
        />
      </View>
    </View>
  )
}

export default OwnedTokenDetail
