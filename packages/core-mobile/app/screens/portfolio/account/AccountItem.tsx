import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import InputText from 'components/InputText'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { Account, setAccountTitle as setAccountTitleStore } from 'store/account'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchBalanceForAccount,
  QueryStatus,
  selectBalanceStatus,
  selectIsBalanceLoadedForAddress
} from 'store/balance'
import ReloadSVG from 'components/svg/ReloadSVG'
import { ActivityIndicator } from 'components/ActivityIndicator'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectWalletType } from 'store/app'
import { useNetworks } from 'hooks/useNetworks'
import { useBalanceTotalInCurrencyForAccount } from 'hooks/useBalanceTotalInCurrencyForAccount'

type Props = {
  account: Account
  onSelectAccount?: (accountIndex: number) => void
  editable?: boolean
  selected?: boolean
  blurred?: boolean
}

function AccountItem({
  account,
  onSelectAccount,
  editable,
  selected,
  blurred
}: Props): JSX.Element {
  const { activeNetwork } = useNetworks()
  const walletType = useSelector(selectWalletType)
  const context = useApplicationContext()
  const accountBalance = useBalanceTotalInCurrencyForAccount(account.index)
  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAddress(account.index, activeNetwork.chainId)
  )
  const balanceStatus = useSelector(selectBalanceStatus)
  const isBalanceLoading = balanceStatus !== QueryStatus.IDLE

  const [editAccount, setEditAccount] = useState(false)
  const [editedAccountTitle, setEditedAccountTitle] = useState(account.title)
  const [showLoader, setShowLoader] = useState(false)
  const dispatch = useDispatch()

  const bgColor = useMemo(() => {
    if (selected) {
      return context.isDarkMode
        ? context.theme.colorBg3
        : context.theme.colorBg2
    } else {
      return context.theme.colorBg2
    }
  }, [
    context.isDarkMode,
    context.theme.colorBg2,
    context.theme.colorBg3,
    selected
  ])

  const saveAccountTitle = useCallback(
    (newAccountName: string) => {
      setEditAccount(false)
      dispatch(
        setAccountTitleStore({
          title: newAccountName,
          accountIndex: account.index,
          walletType
        })
      )
    },
    [account.index, dispatch, walletType]
  )

  const handleLoadBalance = useCallback(() => {
    dispatch(fetchBalanceForAccount({ accountIndex: account.index }))
    setShowLoader(true)
  }, [account.index, dispatch])

  useEffect(() => {
    if (!isBalanceLoading && showLoader) {
      setShowLoader(false)
    }
  }, [isBalanceLoading, showLoader])

  return (
    <>
      <AvaButton.Base
        onPress={() => onSelectAccount?.(account.index)}
        style={[
          {
            backgroundColor: bgColor,
            padding: 16
          }
        ]}>
        <Row>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {editAccount ? (
              <EditTitle
                title={editedAccountTitle}
                onChangeText={setEditedAccountTitle}
                onSubmit={() => saveAccountTitle(editedAccountTitle)}
              />
            ) : (
              <Title title={account.title} />
            )}
            <Space y={4} />
            {showLoader && (
              <ActivityIndicator style={{ height: 15, width: 15 }} />
            )}
            {!showLoader && !isBalanceLoaded && (
              <AvaButton.TextMedium
                onPress={handleLoadBalance}
                style={{
                  width: 100,
                  height: 30,
                  marginTop: -6, //to keep bigger hit area
                  alignItems: 'flex-start',
                  paddingHorizontal: 0,
                  paddingVertical: 0
                }}>
                View balance
              </AvaButton.TextMedium>
            )}
            {!showLoader && isBalanceLoaded && (
              <Row style={{ alignItems: 'center' }}>
                <AvaText.Body3 currency>{accountBalance}</AvaText.Body3>
                <Space x={8} />
                <AvaButton.Base onPress={handleLoadBalance}>
                  <ReloadSVG />
                </AvaButton.Base>
              </Row>
            )}
            {editable && (
              // For smaller touch area
              <Row>
                {editAccount ? (
                  <Save
                    disabled={!editedAccountTitle}
                    onPress={() => saveAccountTitle(editedAccountTitle)}
                  />
                ) : (
                  <Edit onPress={() => setEditAccount(!editAccount)} />
                )}
              </Row>
            )}
          </View>
          <View>
            <TokenAddress
              address={account.address}
              showIcon
              onCopyAddress={() =>
                AnalyticsService.capture('AccountSelectorEthAddressCopied')
              }
            />
            <Space y={6} />
            <TokenAddress
              address={account.addressBtc}
              showIcon
              onCopyAddress={() =>
                AnalyticsService.capture('AccountSelectorBtcAddressCopied')
              }
            />
          </View>
        </Row>
      </AvaButton.Base>
      {blurred && (
        <View
          style={{
            position: 'absolute',
            backgroundColor: context.theme.overlay,
            width: '100%',
            height: '100%'
          }}
        />
      )}
    </>
  )
}

const Save = ({
  disabled,
  onPress
}: {
  disabled: boolean
  onPress: () => void
}): JSX.Element => {
  const { theme } = useApplicationContext()
  return (
    <AvaButton.Base
      rippleBorderless
      disabled={disabled}
      onPress={onPress}
      style={{ paddingVertical: 4, paddingEnd: 8 }}>
      <AvaText.ButtonMedium textStyle={{ color: theme.colorPrimary1 }}>
        Save
      </AvaText.ButtonMedium>
    </AvaButton.Base>
  )
}

const Edit = ({ onPress }: { onPress: () => void }): JSX.Element => {
  const { theme } = useApplicationContext()
  return (
    <AvaButton.Base
      rippleBorderless
      onPress={onPress}
      style={{ paddingVertical: 4, paddingEnd: 8 }}>
      <AvaText.ButtonMedium textStyle={{ color: theme.colorPrimary1 }}>
        Edit
      </AvaText.ButtonMedium>
    </AvaButton.Base>
  )
}

const EditTitle = ({
  title,
  onChangeText,
  onSubmit
}: {
  title: string
  onChangeText: (text: string) => void
  onSubmit: () => void
}): JSX.Element => {
  const { theme } = useApplicationContext()
  return (
    <Row>
      <InputText
        style={{
          margin: 0,
          backgroundColor: theme.colorBg1,
          borderRadius: 8,
          flex: 1
        }}
        autoFocus
        text={title}
        onSubmit={onSubmit}
        onChangeText={onChangeText}
      />
      <Space x={16} />
    </Row>
  )
}

const Title = ({ title }: { title: string }): JSX.Element => {
  return <AvaText.Heading2 ellipsizeMode={'tail'}>{title}</AvaText.Heading2>
}
export default AccountItem
