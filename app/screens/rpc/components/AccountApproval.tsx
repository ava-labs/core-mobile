import AvaText from 'components/AvaText'
import React, { FC, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { Row } from 'components/Row'
import CarrotSVG from 'components/svg/CarrotSVG'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import AccountItem from 'screens/portfolio/account/AccountItem'
import { PeerMetadata } from 'screens/rpc/util/types'
import { useDispatch, useSelector } from 'react-redux'
import { Account, selectAccounts, setActiveAccountIndex } from 'store/account'
import { useActiveAccount } from 'hooks/useActiveAccount'

interface Props {
  peerMeta: PeerMetadata
  onApprove: () => void
  onReject: () => void
}

const AccountApproval: FC<Props> = ({ peerMeta, onApprove, onReject }) => {
  const theme = useApplicationContext().theme
  const accounts = useSelector(selectAccounts)
  const activeAccount = useActiveAccount()
  const dispatch = useDispatch()
  const [toggleAccountList, setToggleAccountList] = useState(false)

  const onSelectAccount = (accountIndex: number) => {
    dispatch(setActiveAccountIndex(accountIndex))
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
            <Avatar.Custom name={'dapp'} logoUri={peerMeta.icon} size={48} />
          </OvalTagBg>
          <View style={styles.domainUrlContainer}>
            <AvaText.Heading2 textStyle={{ textAlign: 'center' }}>
              {peerMeta.name}
            </AvaText.Heading2>
            <AvaText.Body3 color={theme.colorText1}>{peerMeta.url}</AvaText.Body3>
          </View>
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
                {activeAccount?.title}
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
              data={Object.values(accounts)}
              renderItem={info =>
                renderAccountItem(info.item, onSelectAccount, activeAccount)
              }
            />
          </>
        )}
        <FlexSpacer />
        <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
          Only connect to sites that you trust
        </AvaText.Body2>
        <View style={styles.actionContainer}>
          <AvaButton.PrimaryMedium onPress={onApprove}>
            Approve
          </AvaButton.PrimaryMedium>
          <Space y={21} />
          <AvaButton.SecondaryMedium onPress={onReject}>
            Reject
          </AvaButton.SecondaryMedium>
        </View>
      </SafeAreaView>
    </NativeViewGestureHandler>
  )
}

const renderAccountItem = (
  account: Account,
  onSelectAccount: (accountIndex: number) => void,
  activeAccount?: Account
) => {
  return (
    <AccountItem
      key={account.title}
      account={account}
      editable={false}
      selected={account.index === activeAccount?.index}
      onSelectAccount={onSelectAccount}
    />
  )
}

const styles = StyleSheet.create({
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
    marginTop: 12
  },
  domainUrl: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
    color: 'black'
  }
})

export default AccountApproval
