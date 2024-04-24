import React from 'react'
import { ApproveTransactionView } from 'screens/rpc/components/shared/signTransaction/ApproveTransaction'
import { K2ThemeProvider, View } from '@avalabs/k2-mobile'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'

export default {
  title: 'ApproveTransactionView'
}

export const Default = (): JSX.Element => {
  return (
    <K2ThemeProvider>
      <View sx={{ padding: 16 }}>
        <ApproveTransactionView
          title="Shitcoins"
          toAddress="0xC775C0C30840Cb9F51e21061B054ebf1A00aCC29"
          url="https://traderjoexyz.com/avalanche/stek/0xC775C0C30840Cb9F51e21061B054ebf1A00aCC29"
          editButton={
            <AvaButton.Base>
              <AvaText.TextLink>Edit</AvaText.TextLink>
            </AvaButton.Base>
          }
          tokenName="KONG"
          tokenSymbol="KONG"
          tokenValue="455,759,587.222151641394909179 l12345"
          fiatValue=""
        />
      </View>
    </K2ThemeProvider>
  )
}
