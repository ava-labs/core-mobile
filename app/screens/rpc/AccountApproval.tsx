import AvaText from 'components/AvaText'
import React, { useEffect, useMemo, useState } from 'react'
import { Button, Image, Text, View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import {
  useAccountsContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import AccountDropdown from 'screens/portfolio/account/AccountDropdown'
import { Row } from 'components/Row'
import { Account } from 'dto/Account'
import AppNavigation from 'navigation/AppNavigation'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import CarrotSVG from 'components/svg/CarrotSVG'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import AccountItem from 'screens/portfolio/account/AccountItem'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'

const createStyles = () =>
  StyleSheet.create({
    root: {
      paddingTop: 24,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      minHeight: 200,
      paddingBottom: 20
    },
    accountCardWrapper: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 6
    },
    intro: {
      textAlign: 'center',
      color: 'black',
      fontSize: 16,
      marginBottom: 8,
      marginTop: 16
    },
    warning: {
      color: 'red',
      paddingHorizontal: 24,
      marginVertical: 16,
      fontSize: 14,
      width: '100%',
      textAlign: 'center'
    },
    actionContainer: {
      flex: 0,
      paddingVertical: 16,
      paddingHorizontal: 24
    },
    button: {
      flex: 1
    },
    cancel: {
      marginRight: 8
    },
    confirm: {
      marginLeft: 8
    },
    domainUrlContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10
    },
    domainUrl: {
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 14,
      color: 'black'
    }
  })

const AccountApproval = props => {
  const { description, icon, url, title } = props.currentPageInformation
  const theme = useApplicationContext().theme
  const styles = createStyles()
  const { accounts, setActiveAccount } =
    useApplicationContext().repo.accountsRepo
  const accountsContext = useAccountsContext()
  const [currentAccount, setCurrentAccount] = useState<Account | undefined>()
  const [toggleAccountList, setToggleAccountList] = useState(false)

  useEffect(() => {
    const ac = [...accounts.values()].find(acc => acc.active)
    setCurrentAccount(ac)
  }, [accounts])

  const onSelectAccount = (accountIndex: number) => {
    accountsContext.activateAccount(accountIndex)
    setActiveAccount(accountIndex)
    setCurrentAccount(
      [...accounts.values()].find(acc => acc.index === accountIndex)
    )
  }

  return (
    <NativeViewGestureHandler>
      <SafeAreaView
        style={{
          paddingTop: 32,
          flex: 1,
          paddingHorizontal: 16
        }}>
        <AvaText.LargeTitleBold>Connect to site?</AvaText.LargeTitleBold>
        <Space y={30} />
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <OvalTagBg
            style={{ height: 80, width: 80, backgroundColor: theme.colorBg3 }}>
            <Avatar.Custom name={'dapp'} logoUri={icon} size={48} />
          </OvalTagBg>
          <View style={styles.domainUrlContainer}>
            <AvaText.Heading2 textStyle={{ textAlign: 'center' }}>
              {title}
            </AvaText.Heading2>
            <AvaText.Body3>{url}</AvaText.Body3>
          </View>
          <Space y={16} />
          {/*<AvaText.Body2 color={theme.colorError}>*/}
          {/*  By clicking connect, you allow this dapp to view your public*/}
          {/*  address. This is an important security step to protect your data*/}
          {/*  from potential phishing risks*/}
          {/*</AvaText.Body2>*/}
          <Space y={16} />
        </View>
        <Row
          style={[
            styles.accountCardWrapper,
            { backgroundColor: theme.colorBg3 }
          ]}>
          <AvaButton.Base
            style={{ flex: 1 }}
            onPress={() => setToggleAccountList(!toggleAccountList)}>
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <AvaText.Heading3
                ellipsizeMode={'middle'}
                textStyle={{ marginRight: 16 }}>
                {currentAccount?.title}
              </AvaText.Heading3>
              <CarrotSVG
                color={theme.colorText1}
                direction={toggleAccountList ? 'up' : 'down'}
              />
            </Row>
          </AvaButton.Base>
        </Row>
        {toggleAccountList && (
          <>
            <Space y={4} />
            <BottomSheetFlatList
              style={{ minHeight: 200 }}
              data={[...accounts.values()]}
              renderItem={info => renderAccountItem(info.item, onSelectAccount)}
            />
          </>
        )}
        <FlexSpacer />
        <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
          Only connect to sites that you trust
        </AvaText.Body2>
        <View style={styles.actionContainer}>
          <AvaButton.PrimaryMedium onPress={() => props.onConfirm()}>
            Approve
          </AvaButton.PrimaryMedium>
          <Space y={21} />
          <AvaButton.SecondaryMedium onPress={() => props.onCancel()}>
            Reject
          </AvaButton.SecondaryMedium>
        </View>
      </SafeAreaView>
    </NativeViewGestureHandler>
  )
}

const renderAccountItem = (
  account: Account,
  onSelectAccount: (accountIndex: number) => void
) => {
  return (
    <AccountItem
      key={account.title}
      account={account}
      editable={false}
      selected={account.active}
      onSelectAccount={onSelectAccount}
    />
  )
}

export default AccountApproval
