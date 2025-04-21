import React, {
  useRef,
  useLayoutEffect,
  useCallback,
  useEffect,
  useState
} from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useSelector } from 'react-redux'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { CorePrimaryAccount } from '@avalabs/types'
import { getLogoIconUrl } from 'utils/getLogoIconUrl'
import { showSnackbar } from 'new/common/utils/toast'
import { router } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { TokenLogo } from 'new/common/components/TokenLogo'
import { Button, Text } from '@avalabs/k2-alpine'
import { LinearGradientBottomWrapper } from 'new/common/components/LinearGradientBottomWrapper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SessionProposalV2Params } from 'services/walletconnectv2/walletConnectCache/types'
import { SelectAccounts } from '../components/SelectAccounts'

const showNoActiveAccountMessage = (): void => {
  showSnackbar('There is no active account.')
}

const AuthorizeDappScreenWrapper = (): JSX.Element | null => {
  const [params, setParams] = useState<SessionProposalV2Params>()

  useLayoutEffect(() => {
    setParams(walletConnectCache.sessionProposalParams.get())
  }, [])

  if (!params) {
    return null
  }

  return <AuthorizeDappScreen params={params} />
}

const AuthorizeDappScreen = ({
  params: { request, namespaces }
}: {
  params: SessionProposalV2Params
}): JSX.Element => {
  const shouldRejectOnClose = useRef(true)
  const { bottom } = useSafeAreaInsets()
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const activeAccount = useSelector(selectActiveAccount)
  const allAccounts = useSelector(selectAccounts)
  const [selectedAccounts, setSelectedAccounts] = useState<
    CorePrimaryAccount[]
  >([])
  const peerMeta = request.data.params.proposer.metadata
  const approveDisabled = selectedAccounts.length === 0

  const rejectAndClose = useCallback(() => {
    shouldRejectOnClose.current = false
    onReject(request)
    router.canGoBack() && router.back()
  }, [onReject, request])

  const approveAndClose = useCallback(() => {
    shouldRejectOnClose.current = false
    onApprove(request, { selectedAccounts, namespaces })
    router.canGoBack() && router.back()
  }, [onApprove, request, selectedAccounts, namespaces])

  useEffect(() => {
    if (!activeAccount) {
      showNoActiveAccountMessage()
      rejectAndClose()
    }
  }, [activeAccount, request, rejectAndClose])

  // reject the request
  // when the screen is closed due to
  // user pressing back button or using swipe down gesture
  // note: this is a workaround as we can't detect the swipe down gesture
  useEffect(() => {
    return () => {
      shouldRejectOnClose.current && onReject(request)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSelect = useCallback(
    (account: CorePrimaryAccount): void => {
      if (!selectedAccounts.find(item => item.addressC === account.addressC))
        setSelectedAccounts(current => [...current, account])
      else
        setSelectedAccounts(current =>
          current.filter(item => item.addressC !== account.addressC)
        )
    },
    [selectedAccounts]
  )

  const renderActionButtons = useCallback((): JSX.Element => {
    return (
      <View style={styles.actionContainer}>
        <LinearGradientBottomWrapper>
          <View
            style={{
              paddingHorizontal: 16,
              backgroundColor: '$surfacePrimary',
              paddingBottom: bottom + 16
            }}>
            <Button
              size="large"
              type="primary"
              onPress={approveAndClose}
              disabled={approveDisabled}>
              Connect
            </Button>
            <Button
              size="large"
              type="tertiary"
              style={{ marginTop: 16 }}
              onPress={rejectAndClose}>
              Cancel
            </Button>
          </View>
        </LinearGradientBottomWrapper>
      </View>
    )
  }, [approveDisabled, approveAndClose, bottom, rejectAndClose])

  // TODO render AlertBanner
  // scanResponse && isSiteScanResponseMalicious(scanResponse)
  //  <AlertBanner
  //   alert={{
  //   type: AlertType.DANGER,
  //   details: {
  //    title: 'Scam Application',
  //    description:
  //    'This application is malicious, do not proceed.'
  //   }
  //   }}
  //  />
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconContainer}>
          <TokenLogo logoUri={getLogoIconUrl(peerMeta.icons)} size={62} />
          <View style={styles.domainUrlContainer}>
            <Text variant="body1" style={{ textAlign: 'center' }}>
              Do you want to allow{' '}
              <Text variant="body1" style={{ fontWeight: '600' }}>
                {peerMeta?.url}
              </Text>{' '}
              to access your wallet? Tapping “Connect” will grant full access to
              the accounts selected
            </Text>
          </View>
        </View>
        <SelectAccounts
          onSelect={onSelect}
          selectedAccounts={selectedAccounts}
          accounts={allAccounts}
        />
      </ScrollView>
      {renderActionButtons()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: '60%'
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 48,
    marginHorizontal: 20
  }
})

export default AuthorizeDappScreenWrapper
