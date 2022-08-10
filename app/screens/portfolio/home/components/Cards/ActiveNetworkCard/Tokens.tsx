import React from 'react'
import { View, StyleSheet } from 'react-native'
import { TokenWithBalance } from 'store/balance'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import Avatar from 'components/Avatar'

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
    const price = currencyFormatter(balanceInCurrency ?? 0)
    const tokenTextColor = theme.colorText1

    return (
      <View style={[styles.tokenRow, { marginBottom }]} key={index.toString()}>
        <Avatar.Custom size={16} name={token.name} logoUri={token.logoUri} />
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
