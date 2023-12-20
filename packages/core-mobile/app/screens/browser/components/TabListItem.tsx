import {
  Icons,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useTheme
} from '@avalabs/k2-mobile'
import React, { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'

type Props = {
  title?: string
  imagePath?: string
  onPress: () => void
  onClose: () => void
}

function TabListItem({
  title,
  imagePath,
  onPress,
  onClose
}: Props): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const [width, setWidth] = useState(0)

  function handleLayout({ nativeEvent }: LayoutChangeEvent): void {
    setWidth(nativeEvent.layout.width)
  }

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        sx={{
          backgroundColor: '$neutral850',
          borderRadius: 8,
          overflow: 'hidden'
        }}
        onLayout={handleLayout}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <Text
            variant="buttonSmall"
            sx={{ padding: 8, flexGrow: 1, flexShrink: 1 }}
            numberOfLines={1}>
            {title}
          </Text>
          <Pressable sx={{ padding: 4 }} hitSlop={10} onPress={onClose}>
            {({ pressed }) => (
              <Icons.Navigation.Cancel
                color={colors.$neutral400}
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        </View>
        <Image
          source={{ uri: imagePath }}
          style={{ height: width * IMAGE_RATIO }}
        />
      </View>
    </TouchableOpacity>
  )
}

const IMAGE_RATIO = Math.floor(184 / 164)

export default TabListItem
