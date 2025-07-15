import { useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React from 'react'
import { MarketToken } from 'store/watchlist'
import { TokenActivityTransaction } from './TokenActivityListItem'
import { TransactionTypeIcon } from './TransactionTypeIcon'

const ICON_SIZE = 36
const TOKEN_LOGO_SIZE = 16

export const TransactionIconWithTokenLogo = ({
  tx,
  token,
  showTokenLogo = false
}: {
  tx: TokenActivityTransaction
  token?: MarketToken
  showTokenLogo?: boolean
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.$borderPrimary,
        borderColor: colors.$borderPrimary
      }}>
      <TransactionTypeIcon
        txType={tx.txType}
        isContractCall={tx.isContractCall}
      />
      {token && showTokenLogo ? (
        <View
          style={{
            position: 'absolute',
            bottom: -7,
            right: -5,
            borderWidth: 2,
            borderColor: colors.$surfacePrimary,
            borderRadius: TOKEN_LOGO_SIZE / 2
          }}>
          <TokenLogo
            logoUri={token?.logoUri}
            symbol={token?.symbol}
            size={TOKEN_LOGO_SIZE}
          />
        </View>
      ) : null}
    </View>
  )
}
