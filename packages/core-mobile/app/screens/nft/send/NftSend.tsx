import React, { useEffect, useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import { Text, Button } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import AddressBookLists, {
  AddressBookSource
} from 'components/addressBook/AddressBookLists'
import FlexSpacer from 'components/FlexSpacer'
import { useAddressBookLists } from 'components/addressBook/useAddressBookLists'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { Account, selectActiveAccount } from 'store/account'
import { NFTItem } from 'store/nft'
import { SvgXml } from 'react-native-svg'
import { AddrBookItemType } from 'store/addressBook'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { Contact } from '@avalabs/types'
import { getAddressProperty } from 'store/utils/account&contactGetters'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NFTDetailsSendScreenProps } from 'navigation/types'
import useEVMSend from 'screens/send/hooks/useEVMSend'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance'
import { NetworkTokenWithBalance, TokenType } from '@avalabs/vm-module-types'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { showTransactionErrorToast } from 'utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage'
import { useSendContext } from 'contexts/SendContext'

type NftSendScreenProps = {
  onOpenAddressBook: () => void
}

type NftSendNavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Send
>

export default function NftSend({
  onOpenAddressBook
}: NftSendScreenProps): JSX.Element {
  const navigation = useNavigation<NftSendNavigationProp['navigation']>()
  const { params } = useRoute<NftSendNavigationProp['route']>()
  const {
    token,
    toAddress,
    setToAddress,
    maxFee,
    error,
    isSending,
    isValid,
    isValidating
  } = useSendContext()
  const { activeNetwork } = useNetworks()
  const provider = useMemo(() => getEvmProvider(activeNetwork), [activeNetwork])
  const activeAccount = useSelector(selectActiveAccount)
  const fromAddress = activeAccount?.addressC ?? ''
  const tokens = useSelector(selectTokensWithBalance)
  const nativeToken = tokens.find(
    t => t.type === TokenType.NATIVE
  ) as NetworkTokenWithBalance
  const [touched, setTouched] = useState(false)

  const { send } = useEVMSend({
    chainId: activeNetwork.chainId,
    fromAddress,
    provider,
    maxFee,
    nativeToken
  })

  const canSubmit =
    !isValidating && !isSending && isValid && !!toAddress && error === undefined

  const {
    saveRecentContact,
    onContactSelected: selectContact,
    reset: resetAddressBookList,
    setShowAddressBook,
    showAddressBook
  } = useAddressBookLists()

  const onNextPress = async (): Promise<void> => {
    saveRecentContact()

    if (token === undefined || toAddress === undefined) {
      return
    }

    try {
      await send()

      AnalyticsService.capture('NftSendSucceeded', {
        chainId: activeNetwork.chainId
      })

      audioFeedback(Audios.Send)

      navigation.navigate(AppNavigation.Wallet.Drawer, {
        screen: AppNavigation.Wallet.Tabs,
        params: {
          screen: AppNavigation.Tabs.Portfolio,
          params: {}
        }
      })
    } catch (reason) {
      if (reason instanceof Error && !isUserRejectedError(reason)) {
        showTransactionErrorToast({
          message: getJsonRpcErrorMessage(reason)
        })
        AnalyticsService.capture('NftSendFailed', {
          errorMessage: reason?.message,
          chainId: activeNetwork.chainId
        })
      }
    }
  }

  useEffect(() => {
    if (toAddress) {
      setShowAddressBook(false)
    }
  }, [setShowAddressBook, toAddress])

  useEffect(() => {
    if (touched === false && toAddress) {
      setTouched(true)
    }
  }, [toAddress, token, touched])

  const onContactSelected = (
    item: Contact | Account,
    type: AddrBookItemType,
    source: AddressBookSource
  ): void => {
    setToAddress(getAddressProperty(item))
    selectContact(item, type)
    AnalyticsService.capture('NftSendContactSelected', {
      contactSource: source
    })
  }

  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <Text variant="heading3">Send</Text>
      <Space y={20} />
      <Text variant="heading6">Send To</Text>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          placeholder={'Enter 0x Address'}
          multiline={true}
          onChangeText={text => {
            setToAddress(text)
            resetAddressBookList()
          }}
          text={toAddress ?? ''}
        />
        {!toAddress && (
          <View
            style={{
              position: 'absolute',
              right: 24,
              justifyContent: 'center',
              height: '100%'
            }}>
            <AvaButton.Icon
              onPress={() => setShowAddressBook(!showAddressBook)}>
              <AddressBookSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>
      {showAddressBook ? (
        <View style={{ marginHorizontal: -16, flex: 1 }}>
          <AddressBookLists
            onContactSelected={onContactSelected}
            navigateToAddressBook={onOpenAddressBook}
          />
        </View>
      ) : (
        <>
          <Text variant="heading6">Collectible</Text>
          <CollectibleItem nft={params.nft} />
          <Text variant="body1" sx={{ color: '$dangerMain' }}>
            {touched && error ? error : ''}
          </Text>
          <FlexSpacer />
        </>
      )}
      <Button
        testID="next_btn"
        type="primary"
        size="xlarge"
        onPress={onNextPress}
        disabled={!canSubmit}
        style={{ marginBottom: 16 }}>
        Next
      </Button>
    </ScrollView>
  )
}

const CollectibleItem = ({ nft }: { nft: NFTItem }): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <View
      style={[
        styles.collectibleItem,
        {
          backgroundColor: theme.colorBg2
        }
      ]}>
      <Row>
        <View style={{ borderRadius: 8 }}>
          {nft.imageData?.isSvg ? (
            <View style={{ alignItems: 'center' }}>
              <SvgXml
                xml={nft.imageData?.image ?? null}
                width={80}
                height={80 * (nft.imageData?.aspect ?? 1)}
              />
            </View>
          ) : (
            <Image
              style={styles.nftImage}
              source={{ uri: nft.imageData?.image }}
              width={80}
              height={80}
            />
          )}
        </View>
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <Text
            variant="heading5"
            testID="NftTokenID"
            numberOfLines={1}
            ellipsizeMode="tail">
            #{nft.tokenId}
          </Text>
          <Text
            variant="heading6"
            testID="NftTokenName"
            numberOfLines={1}
            ellipsizeMode="tail">
            {nft.processedMetadata.name}
          </Text>
        </View>
      </Row>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    minHeight: '100%'
  },
  collectibleItem: {
    marginVertical: 16,
    borderRadius: 8,
    padding: 16
  },
  nftImage: {
    borderRadius: 8
  }
})
