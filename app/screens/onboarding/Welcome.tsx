import React from 'react'
import {StyleSheet, View} from 'react-native'
import AvaButton from 'components/AvaButton'
import {Space} from 'components/Space'
import AvaText from 'components/AvaText'
import {Row} from 'components/Row'
import Separator from 'components/Separator'
import WalletSVG from 'components/svg/WalletSVG'
import CreateNewWalletPlusSVG from 'components/svg/CreateNewWalletPlusSVG'
import CoreLogo from 'components/CoreLogo'

type Props = {
  onCreateWallet: () => void
  onAlreadyHaveWallet: () => void
  onEnterWallet: (mnemonic: string) => void
}

const pkg = require('../../../package.json')

export default function Welcome(props: Props | Readonly<Props>): JSX.Element {
  const onCreateWallet = (): void => {
    props.onCreateWallet()
  }

  const onAlreadyHaveWallet = (): void => {
    props.onAlreadyHaveWallet()
  }

  return (
    <View style={styles.verticalLayout}>
      <CoreLogo style={{minHeight: 400}} />
      <Row>
        <View style={{flex: 1, alignItems: 'center'}}>
          <AvaButton.Base
            style={{alignItems: 'center'}}
            onPress={onCreateWallet}>
            <CreateNewWalletPlusSVG size={64} />
            <Space y={38} />
            <AvaText.ActivityTotal textStyle={{textAlign: 'center'}}>
              {'Create a New\n Wallet'}
            </AvaText.ActivityTotal>
          </AvaButton.Base>
        </View>
        <Separator vertical thickness={3} />
        <View style={{flex: 1, alignItems: 'center'}}>
          <AvaButton.Base
            style={{alignItems: 'center'}}
            onPress={onAlreadyHaveWallet}>
            <WalletSVG />
            <Space y={38} />
            <AvaText.ActivityTotal textStyle={{textAlign: 'center'}}>
              {'Access\n Existing Wallet'}
            </AvaText.ActivityTotal>
          </AvaButton.Base>
        </View>
      </Row>

      <AvaText.Body2 textStyle={{position: 'absolute', top: 0, left: 16}}>
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
