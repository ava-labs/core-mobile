import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { BottomSheet } from 'components/BottomSheet'
import AvaText from 'components/AvaText'
import BridgeTokenSelector, {
  SelectTokenMode
} from 'screens/bridge/BridgeTokenSelector'
import AppNavigation from 'navigation/AppNavigation'
import { BridgeScreenProps } from 'navigation/types'

type RouteProp = BridgeScreenProps<
  typeof AppNavigation.Modal.BridgeSelectToken
>['route']

function BridgeSelectTokenBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()
  const { params } = useRoute<RouteProp>()

  function onTokenSelected(symbol: string) {
    goBack()
    params.onTokenSelected(symbol)
  }

  return (
    <BottomSheet>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Select Token
      </AvaText.LargeTitleBold>
      <BridgeTokenSelector
        onTokenSelected={onTokenSelected}
        bridgeTokenList={params.bridgeTokenList ?? []}
        selectMode={SelectTokenMode.TRANSFER}
        horizontalMargin={0}
      />
    </BottomSheet>
  )
}

export default BridgeSelectTokenBottomSheet
