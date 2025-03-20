import React from 'react'
import { Linking, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { ScrollView } from 'react-native-gesture-handler'
import { Space } from 'components/Space'
import Logger from 'utils/Logger'
import { DOCS_STAKING_URL } from 'resources/Constants'

export const Disclaimer = (): JSX.Element => {
  const { theme } = useApplicationContext()

  const goToDelegatingDocs = (): void => {
    Linking.openURL(DOCS_STAKING_URL).catch(e => {
      Logger.error(DOCS_STAKING_URL, e)
    })
  }

  return (
    <View style={{ marginHorizontal: 16, flex: 1 }}>
      <Space y={16} />
      <View>
        <AvaText.LargeTitleBold>Disclaimer</AvaText.LargeTitleBold>
      </View>
      <ScrollView>
        <Space y={24} />
        <View>
          <AvaText.Body2 textStyle={{ color: theme.neutral50, lineHeight: 20 }}>
            {
              'Delegating is a feature of Avalanche’s staking mechanism that allows token holders to participate in securing a network by adding their tokens to an existing validator to stake. When delegating, the token holder remains in control at all times of its tokens and keys but locks up the value of its tokens. In exchange for locking up the value of its tokens, the token holder receives a share of the staking rewards received by the validator based on its delegation amount, less a fee retained by the validator called a Delegation Fee.'
            }
          </AvaText.Body2>
        </View>
        <Space y={16} />
        <View>
          <AvaText.Body2 textStyle={{ color: theme.neutral50, lineHeight: 20 }}>
            {
              'When selecting a validator, it is important to consider factors, such as uptime, staking period and others, in addition to the Delegation Fee. Please conduct your own research before delegating. To learn more about delegating, '
            }
            <AvaText.Body2
              onPress={goToDelegatingDocs}
              color={theme.colorPrimary1}>
              click here
            </AvaText.Body2>
            <AvaText.Body2>{'.'}</AvaText.Body2>
          </AvaText.Body2>
        </View>
        <Space y={16} />
        <AvaText.Body2 textStyle={{ color: theme.neutral50, lineHeight: 20 }}>
          {
            'Stake allows users to participate in securing the Avalanche blockchain by delegating their tokens to validators while at all times remaining in control of their tokens and their keys. The information displayed in this feature and in the various windows is pulled from data that is publicly available on-chain and (a) does not constitute an endorsement of any network or project; (b) does not constitute investment advice; (c) where estimated rewards are calculated, they do not represent any assurance that you will achieve the same; (d) are not a substitute for professional advice and (e) are provided without representation, warranty or guarantee of any kind. Ava Labs disclaims any liability for any loss arising from the use of the information or estimates contained herein.'
          }
        </AvaText.Body2>
        <Space y={32} />
      </ScrollView>
    </View>
  )
}
