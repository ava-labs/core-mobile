import React from 'react'
import {
  Text,
  TextInput,
  useTheme,
  View,
  Icons,
  Button,
  TouchableOpacity
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'

const PasskeyScreen = (): JSX.Element => {
  const [value, setValue] = React.useState<string>()
  const {
    theme: { colors }
  } = useTheme()

  return (
    <BlurredBarsContentLayout>
      <View
        style={{
          flex: 1,
          marginHorizontal: 16,
          marginTop: 25,
          justifyContent: 'space-between'
        }}>
        <View>
          <Text variant="heading2">
            How would you like to name your passkey?
          </Text>
          <Text variant="body1" sx={{ marginTop: 14 }}>
            Add a Passkey name, so it’s easier to find later
          </Text>
          <View
            sx={{
              marginTop: 27,
              paddingHorizontal: 13,
              backgroundColor: colors.$surfaceSecondary,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 44
            }}>
            <TextInput
              sx={{
                flex: 1,
                fontFamily: 'Inter-Regular',
                marginRight: 13,
                height: 44,
                fontSize: 16,
                color: colors.$textPrimary
              }}
              value={value}
              onChangeText={setValue}
            />
            <TouchableOpacity onPress={() => setValue('')}>
              <Icons.Action.Clear
                width={16}
                height={16}
                color={colors.$textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View sx={{ marginVertical: 36 }}>
          <Button type="primary" size="large" disabled={value === ''}>
            Next
          </Button>
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default PasskeyScreen
