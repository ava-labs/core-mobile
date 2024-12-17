import { useRouter } from 'expo-router'
import React from 'react'
import { Button, ScrollView, Text, View } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'

const OnboardingScreen = (): JSX.Element => {
  const { navigate } = useRouter()

  const handleOnPress = (): void => {
    navigate('/signup/onboarding/authenticatorSetup')
  }

  return (
    <BlurredBarsContentLayout
      sx={{
        justifyContent: 'space-between',
        marginHorizontal: 16
      }}>
      <View sx={{ flex: 1 }}>
        <ScrollView sx={{ marginTop: 27 }}>
          <Text variant="heading3" sx={{ marginBottom: 10 }}>
            Terms and conditions
          </Text>
          <Text variant="subtitle2" sx={{ fontSize: 12 }}>
            These Terms of Use (these “Terms”) constitute a legally binding
            agreement made between you, whether personally or on behalf of an
            entity (“you”) and Ava Labs, Inc. (together with its subsidiaries
            and affiliates, “Company”, “we”, “us”, or “our”) governing your
            download, access to and/or use of the Core Browser Extension, the
            Core Mobile Application, the CoreWeb website, the core.app website
            and any related websites, applications or API (collectively, the
            “App”). The App enables users to self-custody digital assets,
            directly access and interact with blockchains, decentralized
            applications (“dapps”) and the Avalanche Bridge on a peer-to-peer
            basis, directly interact with other third party services, view
            market data and access other functionality that may be developed
            from time to time (collectively, the “Services”). The Services
            include, without limitation, services provided by third parties and
            dapps (collectively, “Third Party Services”) and support channels,
            including third party platforms such as Telegram and Discord, and
            other resources, including any FAQs and help articles we publish.
            {'\n'}
          </Text>
          <Text variant="subtitle2" sx={{ fontSize: 12 }}>
            You agree that by downloading, accessing or using the App in any
            way, including, without limitation, evaluating, downloading,
            purchasing and/or using any of the Services offered through the App
            or any of the Third Party Services you may interact with, you
            expressly acknowledge that you have read and agree to be bound by
            all of these Terms and the Important Notice , which is hereby
            incorporated herein by reference.
            {'\n'}
          </Text>
          <Text variant="subtitle2" sx={{ fontSize: 12, fontWeight: '600' }}>
            IF YOU DO NOT AGREE WITH SUCH TERMS, THEN YOU ARE EXPRESSLY
            PROHIBITED FROM USING THE APP AND THE SERVICES AND YOU MUST
            DISCONTINUE USE IMMEDIATELY.{'\n'}
          </Text>
          <Text variant="subtitle2" sx={{ fontSize: 12 }}>
            Important notice (provided for convenience only; please review the
            relevant provisions in these Terms):
          </Text>
          <Text variant="subtitle2" sx={{ fontSize: 12 }}>
            Your responsibility: The App is self-custodial in nature. You are
            solely responsible for the safeguarding, retention and security of
            your seed phrase, private keys and password. If you lose your seed
            phrase, private keys or password, you will not be able to access
            your digital assets.{' '}
            <Text variant="subtitle2" sx={{ fontSize: 12, fontWeight: '600' }}>
              ARBITRATION: THESE TERMS INCLUDE, AMONG OTHER THINGS, A BINDING
              ARBITRATION CLAUSE AND A CLASS ACTION WAIVER. PLEASE REFER TO THE
              SECTION ENTITLED “DISPUTE RESOLUTION” BELOW FOR MORE INFORMATION.
            </Text>
          </Text>
          <Text variant="subtitle2" sx={{ fontSize: 12 }}>
            Third Party Services: Third Party Services are made available
            through the App and provided directly by third parties. If you
            choose to access Third Party Services, including without limitation
            MoonPay and ParaSwap, you will be interacting directly with such
            services and will be subject to their terms, policies and fees. We
            are not liable for any loss or damages you may incur arising from or
            in connection with Third Party Services . Liability: We are not
            liable for any special or consequential damages arising from your
            use of the App and other scenarios. Our aggregate liability to you
            shall not exceed $100.
          </Text>
          <Text variant="subtitle2" sx={{ fontSize: 12 }}>
            Indemnity: You will indemnify us for any third party claim in
            connection with your use of the App and other scenarios.
          </Text>
        </ScrollView>
      </View>
      {/* <BlurView
        style={{
          marginBottom: 36,
          marginTop: 20,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        // tint={theme.isDark ? 'dark' : undefined}
        intensity={75}
        experimentalBlurMethod="dimezisBlurView"
      /> */}
      <View sx={{ marginBottom: 36, marginTop: 20 }}>
        <Button type="primary" size="large" onPress={handleOnPress}>
          Agree and continue
        </Button>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default OnboardingScreen
