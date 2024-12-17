import React, { useState } from 'react'
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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FidoType } from 'services/passkey/types'
import { useAuthenticatorSetup } from './useAuthenticatorSetup'

type FIDONameInputScreenProps = {
  fidoType: FidoType
  title: string
  description: string
  textInputPlaceholder: string
  //   onClose: (name?: string) => Promise<void>
}

const FidoNameInput = (): JSX.Element => {
  const router = useRouter()
  const { registerAndAuthenticateFido } = useAuthenticatorSetup()
  const { title, description, textInputPlaceholder, fidoType } =
    useLocalSearchParams<FIDONameInputScreenProps>()
  const [name, setName] = useState<string>()
  const {
    theme: { colors }
  } = useTheme()

  const handleSave = (): void => {
    if (router.canGoBack()) {
      router.back()
    }
    // onClose(name)
    fidoType && registerAndAuthenticateFido({ name, fidoType })
  }

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
          <Text variant="heading2">{title}</Text>
          <Text variant="body1" sx={{ marginTop: 14 }}>
            {description}
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
              value={name}
              onChangeText={setName}
              placeholder={textInputPlaceholder}
            />
            <TouchableOpacity onPress={() => setName('')}>
              <Icons.Action.Clear
                width={16}
                height={16}
                color={colors.$textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View sx={{ marginVertical: 36 }}>
          <Button
            type="primary"
            size="large"
            disabled={name === ''}
            onPress={handleSave}>
            Next
          </Button>
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default FidoNameInput
