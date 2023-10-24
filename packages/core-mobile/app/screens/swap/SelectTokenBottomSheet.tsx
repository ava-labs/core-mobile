import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { BottomSheet } from 'components/BottomSheet'
import TokenSelector from 'screens/send/TokenSelector'
import AvaText from 'components/AvaText'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { TokenWithBalance } from 'store/balance'

type RouteProp = WalletScreenProps<
  typeof AppNavigation.Modal.SelectToken
>['route']

function SelectTokenBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()
  const { params } = useRoute<RouteProp>()

  function onTokenSelected(token: TokenWithBalance) {
    goBack()
    params.onTokenSelected(token)
  }

  return (
    <BottomSheet>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Select Token
      </AvaText.LargeTitleBold>
      <TokenSelector
        onTokenSelected={onTokenSelected}
        hideZeroBalance={params.hideZeroBalance}
      />
    </BottomSheet>
  )
}

export default SelectTokenBottomSheet
