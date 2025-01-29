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
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { FIDONameInputProps } from 'new/routes/onboarding/seedless/(fido)/fidoNameInput'

const FidoNameInput = ({
  title,
  description,
  textInputPlaceholder,
  name,
  setName,
  handleSave
}: Omit<FIDONameInputProps, 'fidoType'> & {
  name: string
  setName: (value: string) => void
  handleSave: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const handleClear = (): void => setName('')

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
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={textInputPlaceholder}
            rightIcon={
              <TouchableOpacity onPress={handleClear}>
                <Icons.Action.Clear
                  width={16}
                  height={16}
                  color={colors.$textSecondary}
                />
              </TouchableOpacity>
            }
          />
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
