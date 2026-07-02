import {
  ActivityIndicator,
  Button,
  Icons,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import React from 'react'
import { CardPos } from '../utils/buildWalletListRows'
import { CardRow } from './CardRow'

const AddAccountRow = ({
  wallet,
  cardPos
}: {
  wallet: WalletDisplayData
  cardPos: CardPos
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { handleAddAccount, isAddingAccount } = useManageWallet()

  return (
    <CardRow cardPos={cardPos}>
      <View
        sx={{
          paddingHorizontal: 10,
          paddingTop: 10,
          paddingBottom: 10
        }}>
        <Button
          size="medium"
          leftIcon={
            isAddingAccount ? undefined : (
              <Icons.Content.Add
                color={colors.$textPrimary}
                width={24}
                height={24}
              />
            )
          }
          type="secondary"
          disabled={isAddingAccount}
          testID={`add_account_btn__${wallet.name}`}
          onPress={() => handleAddAccount(wallet)}>
          {isAddingAccount ? (
            <ActivityIndicator size="small" color={colors.$textPrimary} />
          ) : (
            'Add account'
          )}
        </Button>
      </View>
    </CardRow>
  )
}

export default React.memo(AddAccountRow)
