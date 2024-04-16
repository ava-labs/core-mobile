import React, { useEffect, useState, JSX } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaListItem from 'components/AvaListItem'
import LinkSVG from 'components/svg/LinkSVG'
import moment from 'moment'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import useInAppBrowser from 'hooks/useInAppBrowser'
import Separator from 'components/Separator'
import { truncateAddress } from 'utils/Utils'
import { useRoute } from '@react-navigation/native'
import DotSVG from 'components/svg/DotSVG'
import FlexSpacer from 'components/FlexSpacer'
import Avatar from 'components/Avatar'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { useSelector } from 'react-redux'
import { Contact, selectContacts } from 'store/addressBook'
import { balanceToDisplayValue, numberToBN } from '@avalabs/utils-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'

type RouteProp = WalletScreenProps<
  typeof AppNavigation.Wallet.ActivityDetail
>['route']

function ActivityDetail(): JSX.Element {
  const { activeNetwork, getTokenInfo } = useNetworks()
  const theme = useApplicationContext().theme
  const contacts = useSelector(selectContacts)
  const txItem = useRoute<RouteProp>().params.tx
  const tokenInfo = getTokenInfo(txItem?.token?.symbol ?? '')
  const date = moment(txItem?.timestamp).format('MMM DD, YYYY HH:mm')
  const { openUrl } = useInAppBrowser()
  const [contact, setContact] = useState<Contact>()

  const feeBN = numberToBN(txItem?.fee ?? '', 0)
  const fees = balanceToDisplayValue(
    feeBN,
    Number(activeNetwork.networkToken.decimals)
  )

  useEffect(getContactMatchFx, [contacts, txItem])

  function getContactMatchFx(): void {
    const address = txItem?.isSender ? txItem.to : txItem?.from
    const filtered = Object.values(contacts).filter(
      value => value.address === address
    )
    if (filtered.length > 0) {
      setContact(filtered[0])
    }
  }

  const tokenLogo = (): JSX.Element | undefined => {
    if (txItem && txItem.token) {
      const { name, symbol } = txItem.token
      return (
        <Avatar.Custom
          size={57}
          name={name}
          symbol={symbol}
          logoUri={tokenInfo?.logoUri}
        />
      )
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {txItem && (
        <View
          style={{
            backgroundColor: theme.colorBg2,
            marginTop: 45,
            paddingTop: 10,
            flex: 1
          }}>
          <View style={styles.logoContainer}>
            <View
              style={{ position: 'absolute' }}
              testID="activity_detail__logo">
              <DotSVG
                fillColor={theme.colorBg1}
                size={72}
                testID="activity_detail__logo"
              />
            </View>
            {tokenLogo()}
          </View>
          <View style={styles.headerContainer}>
            <AvaText.Heading1
              textStyle={{ marginTop: 16 }}
              testID="activity_detail__amount">
              {txItem.isSender ? '-' : '+'}
              {txItem.amount}
              <AvaText.Body1 color={theme.colorText2}>
                {` ${txItem.token?.symbol}`}
              </AvaText.Body1>
            </AvaText.Heading1>
            <Space y={4} />
            <AvaText.Body2 testID="activity_detail__fee_amount">{` Fee ${fees} ${activeNetwork.networkToken.symbol}`}</AvaText.Body2>
          </View>
          <Space y={16} />
          <AvaListItem.Base
            testID={'activity_detail__status'}
            title={<AvaText.Body2>Status</AvaText.Body2>}
            titleAlignment={'flex-start'}
            rightComponent={<AvaText.Heading3>Complete</AvaText.Heading3>}
          />
          <Separator inset={16} />
          <AvaListItem.Base
            testID="activity_detail__date"
            title={<AvaText.Body2>Date</AvaText.Body2>}
            titleAlignment={'flex-start'}
            rightComponent={
              <AvaText.Heading3 testID="activity_detail__date">
                {date}
              </AvaText.Heading3>
            }
          />
          <Separator inset={16} />
          <AvaListItem.Base
            testID="activity_detail__to_from"
            title={
              <AvaText.Body2>{txItem.isSender ? 'To' : 'From'}</AvaText.Body2>
            }
            titleAlignment={'flex-start'}
            rightComponent={
              <View style={{ alignItems: 'flex-end' }}>
                {contact && (
                  <AvaText.Heading3>{contact?.title}</AvaText.Heading3>
                )}
                <AvaText.Body1 testID="address">
                  {truncateAddress(
                    txItem.isSender ? txItem.to : txItem.from
                  ).toLowerCase()}
                </AvaText.Body1>
              </View>
            }
          />
          <Separator inset={16} />
          <AvaListItem.Base
            title={<AvaText.Body2>Transaction Type</AvaText.Body2>}
            titleAlignment={'flex-start'}
            rightComponent={
              <AvaText.Body1 testID="activity_detail__transaction_type">
                {txItem.isSender ? 'Outgoing Transfer' : 'Incoming Transfer'}
              </AvaText.Body1>
            }
          />
          <FlexSpacer />
          {!!txItem.explorerLink && (
            <>
              <Pressable
                style={[styles.explorerLink]}
                onPress={() => {
                  openUrl(txItem.explorerLink)
                }}>
                <LinkSVG color={theme.white} />
                <AvaText.ButtonLarge
                  testID="activity_detail__explorer_button"
                  textStyle={{ marginLeft: 8 }}
                  color={theme.white}>
                  View on Explorer
                </AvaText.ButtonLarge>
              </Pressable>
              <Space y={16} />
            </>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 25
  },
  headerContainer: {
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden'
  },
  explorerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 48,
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#FFFFFF26'
  }
})

export default ActivityDetail
