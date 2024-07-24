import AvaText from 'components/AvaText'
import React, { useState } from 'react'
import { FlatList, ListRenderItem, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import CarrotSVG from 'components/svg/CarrotSVG'
import { Account, AccountCollection } from 'store/account'
import Separator from 'components/Separator'
import AccountItem from './AccountItem'

type Props = {
  accounts: AccountCollection
  selectedAccounts: string[]
  onSelect: (accountIndex: string) => void
}

const AccountSeparator = (): JSX.Element => {
  const { theme } = useApplicationContext()
  return <Separator color={theme.neutral700} />
}

const SelectAccounts = ({
  accounts,
  selectedAccounts,
  onSelect
}: Props): JSX.Element => {
  const { theme } = useApplicationContext()
  const [showAccounts, setShowAccounts] = useState<boolean>(false)

  const accArray = [...Object.values(accounts)]

  const title =
    selectedAccounts.length === 0
      ? 'Select Accounts'
      : selectedAccounts.length === 1
      ? '1 Account Selected'
      : `${selectedAccounts.length} Accounts Selected`

  const renderItem: ListRenderItem<Account> = ({ item }) => (
    <AccountItem
      account={item}
      selected={selectedAccounts.includes(item.addressC)}
      onSelect={onSelect}
    />
  )

  return (
    <View>
      <AvaButton.Base
        onPress={() => {
          setShowAccounts(current => !current)
        }}>
        <View
          style={{
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderBottomLeftRadius: showAccounts ? 0 : 8,
            borderBottomRightRadius: showAccounts ? 0 : 8,
            backgroundColor: theme.colorBg3
          }}>
          <Row
            style={{
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 16,
              paddingRight: showAccounts ? 14 : 24,
              backgroundColor: theme.neutral850,
              borderRadius: 8,
              justifyContent: 'space-between'
            }}>
            <AvaText.Heading3>{title}</AvaText.Heading3>
            <CarrotSVG direction={showAccounts ? 'up' : 'down'} />
          </Row>
        </View>
      </AvaButton.Base>
      {showAccounts && (
        <FlatList
          data={accArray}
          renderItem={renderItem}
          keyExtractor={item => item.index.toString()}
          ItemSeparatorComponent={AccountSeparator}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  listContainer: {
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
    overflow: 'hidden'
  }
})

export default SelectAccounts
