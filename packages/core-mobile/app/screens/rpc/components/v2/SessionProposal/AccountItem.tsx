import { ActivityIndicator } from 'components/ActivityIndicator'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import { Checkbox } from 'components/Checkbox'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import ReloadSVG from 'components/svg/ReloadSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useBalanceTotalInCurrencyForAccount } from 'hooks/useBalanceTotalInCurrencyForAccount'
import { useNetworks } from 'hooks/useNetworks'
import React, { useCallback, useEffect, useState, JSX } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Account } from 'store/account'
import {
  fetchBalanceForAccount,
  QueryStatus,
  selectBalanceStatus,
  selectIsBalanceLoadedForAddress
} from 'store/balance'
import { truncateAddress } from 'utils/Utils'

type Props = {
  account: Account
  onSelect: (accountIndex: string) => void
  selected: boolean
}

const AccountItem = ({ account, onSelect, selected }: Props): JSX.Element => {
  const { theme } = useApplicationContext()
  const { selectActiveNetwork } = useNetworks()
  const network = selectActiveNetwork()
  const accountBalance = useBalanceTotalInCurrencyForAccount(account.index)

  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAddress(account.index, network.chainId)
  )
  const balanceStatus = useSelector(selectBalanceStatus)
  const isBalanceLoading = balanceStatus !== QueryStatus.IDLE

  const [showLoader, setShowLoader] = useState(false)

  const dispatch = useDispatch()

  const handleLoadBalance = useCallback(() => {
    dispatch(fetchBalanceForAccount({ accountIndex: account.index }))
    setShowLoader(true)
  }, [account.index, dispatch])

  useEffect(() => {
    if (!isBalanceLoading && showLoader) {
      setShowLoader(false)
    }
  }, [isBalanceLoading, showLoader])

  const address = truncateAddress(account.address, 5)

  return (
    <Row
      style={[
        {
          flex: 1,
          backgroundColor: theme.colorBg3,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
          paddingRight: 6
        }
      ]}>
      <View style={styles.accountTitleContainer}>
        <AvaText.ButtonLarge textStyle={{ color: theme.colorText1 }}>
          {account.title}
          <AvaText.ButtonLarge
            textStyle={{ color: theme.colorText1, fontWeight: 'normal' }}>
            {' (' + address + ')'}
          </AvaText.ButtonLarge>
        </AvaText.ButtonLarge>
        <Space y={4} />
        {showLoader && <ActivityIndicator style={styles.loader} />}
        {!showLoader && !isBalanceLoaded && (
          <AvaButton.TextMedium
            onPress={handleLoadBalance}
            style={styles.viewBalance}>
            View balance
          </AvaButton.TextMedium>
        )}
        {!showLoader && isBalanceLoaded && (
          <Row style={{ alignItems: 'center' }}>
            <AvaText.Body3 textStyle={{ color: theme.colorText2 }}>
              {'Balance: '}
            </AvaText.Body3>
            <AvaText.Body3 textStyle={{ color: theme.colorText2 }} currency>
              {accountBalance}
            </AvaText.Body3>
            <Space x={8} />
            <AvaButton.Base onPress={handleLoadBalance}>
              <ReloadSVG />
            </AvaButton.Base>
          </Row>
        )}
      </View>
      <Checkbox
        selected={selected}
        onPress={() => {
          onSelect(account.address)
        }}
      />
    </Row>
  )
}

const styles = StyleSheet.create({
  accountTitleContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  loader: { height: 15, width: 15 },
  viewBalance: {
    width: 100,
    height: 30,
    marginTop: -6,
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0
  }
})

export default AccountItem
