import React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { TokenWithBalance } from 'store/balance'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSearchableTokenList } from '../../useSearchableTokenList'

const Tokens = () => {
  const { filteredTokenList: tokens } = useSearchableTokenList()
  const {
    appHook: { currencyFormatter },
    theme
  } = useApplicationContext()

  const tokensToDisplay = tokens.slice(0, 4)

  const renderToken = (
    token: TokenWithBalance,
    index: number,
    allTokens: TokenWithBalance[]
  ) => {
    const { balanceInCurrency } = token
    const lastItem = index === allTokens.length - 1
    const marginBottom = lastItem ? 0 : 8
    const price = currencyFormatter(balanceInCurrency)
    const tokenTextColor = theme.colorText1

    return (
      <View style={[styles.tokenRow, { marginBottom }]}>
        <Image source={{ uri: token.logoUri }} style={styles.smallIcon} />
        <AvaText.ButtonSmall
          color={tokenTextColor}
          textStyle={styles.tokenNameText}>
          {token.name}
        </AvaText.ButtonSmall>
        <AvaText.Caption ellipsizeMode={'tail'} color={tokenTextColor}>
          {price}
        </AvaText.Caption>
      </View>
    )
  }

  const renderMoreText = () => {
    const moreTextColor = theme.colorPrimary1
    const moreText = tokens.length - tokensToDisplay.length

    if (moreText === 0) return null

    return (
      <AvaText.ButtonSmall color={moreTextColor} textStyle={styles.moreText}>
        + {moreText} more
      </AvaText.ButtonSmall>
    )
  }

  return (
    <>
      {tokensToDisplay.map(renderToken)}
      {renderMoreText()}
    </>
  )
}

const styles = StyleSheet.create({
  smallIcon: {
    width: 16,
    height: 16,
    borderRadius: 16 / 2
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tokenNameText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 16
  },
  moreText: {
    marginTop: 22,
    alignSelf: 'flex-end'
  }
})

export default Tokens
