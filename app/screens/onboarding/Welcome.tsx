import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import WalletSVG from 'components/svg/WalletSVG'
import CreateNewWalletPlusSVG from 'components/svg/CreateNewWalletPlusSVG'
import { usePosthogContext } from 'contexts/PosthogContext'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { useSelector } from 'react-redux'
import { selectIsReady } from 'store/app'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'

type Props = {
  onCreateWallet: () => void
  onAlreadyHaveWallet: () => void
}

const pkg = require('../../../package.json')

export default function Welcome({
  onCreateWallet,
  onAlreadyHaveWallet
}: Props | Readonly<Props>): JSX.Element {
  const { capture } = usePosthogContext()
  const isAppReady = useSelector(selectIsReady)
  const { pendingDeepLink } = useDappConnectionContext()

  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isAppReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }).start()
      if (pendingDeepLink) {
        showSnackBarCustom({
          component: (
            <GeneralToast
              message={`No wallet found. Create or add a wallet to Core to connect to applications.`}
            />
          ),
          duration: 'short'
        })
      }
    }
  }, [fadeAnim, isAppReady, pendingDeepLink])

  const onCreateNewWallet = (): void => {
    capture('OnboardingCreateNewWalletSelected').catch(() => undefined)
    onCreateWallet()
  }

  const onAccessWallet = (): void => {
    capture('OnboardingImportWalletSelected').catch(() => undefined)
    capture('OnboardingImportMnemonicSelected').catch(() => undefined)
    onAlreadyHaveWallet()
  }

  return (
    <View style={styles.verticalLayout}>
      <View style={{ height: 400, justifyContent: 'center' }}>
        <CoreXLogoAnimated size={200} />
      </View>
      {isAppReady && (
        <Animated.View
          style={{
            opacity: fadeAnim
          }}>
          <Row>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <AvaButton.Base
                style={{ alignItems: 'center' }}
                onPress={onCreateNewWallet}>
                <CreateNewWalletPlusSVG size={64} />
                <Space y={38} />
                <AvaText.ActivityTotal textStyle={{ textAlign: 'center' }}>
                  {'Create a New\n Wallet'}
                </AvaText.ActivityTotal>
              </AvaButton.Base>
            </View>
            <Separator vertical thickness={3} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <AvaButton.Base
                style={{ alignItems: 'center' }}
                onPress={onAccessWallet}>
                <WalletSVG />
                <Space y={38} />
                <AvaText.ActivityTotal textStyle={{ textAlign: 'center' }}>
                  {'Access\n Existing Wallet'}
                </AvaText.ActivityTotal>
              </AvaButton.Base>
            </View>
          </Row>
        </Animated.View>
      )}

      <AvaText.Body2 textStyle={{ position: 'absolute', bottom: 0, left: 16 }}>
        v{pkg.version}
      </AvaText.Body2>
    </View>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    padding: 16,
    height: '100%'
  },
  buttonWithText: {
    alignItems: 'center'
  },
  logoContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  }
})
