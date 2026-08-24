import React from 'react'
import { TouchableOpacity } from 'react-native'
import { Icons, Text, View, useTheme } from '@avalabs/k2-alpine'
import {
  useIsActiveWalletKeystoneDeprecated,
  useKeystoneDeprecation
} from 'features/keystone/hooks/useKeystoneDeprecation'
import { KEYSTONE_DEPRECATION_DATE } from 'resources/Constants'

/**
 * Portfolio notice that Keystone signing has been retired. Renders only when the
 * active wallet is Keystone and the master `keystone` gate is off, and reserves
 * no space otherwise, so callers should pass margins via `sx` rather than
 * wrapping it in a spacing container.
 */
export const KeystoneDeprecationBanner = ({
  sx
}: {
  sx?: React.ComponentProps<typeof View>['sx']
} = {}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const { openDeprecationInfo } = useKeystoneDeprecation()
  const shouldWarn = useIsActiveWalletKeystoneDeprecated()

  if (!shouldWarn) {
    return null
  }

  return (
    <View sx={sx}>
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="button"
        testID="keystoneDeprecationBanner"
        onPress={openDeprecationInfo}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 4
          }}>
          <Icons.Alert.Error
            color={colors.$textDanger}
            width={16}
            height={16}
          />
          <Text
            variant="caption"
            sx={{
              color: '$textDanger',
              flex: 1,
              fontSize: 13,
              lineHeight: 17
            }}>
            {`Keystone wallet support was deprecated on ${KEYSTONE_DEPRECATION_DATE}. Click here for more information.`}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}
