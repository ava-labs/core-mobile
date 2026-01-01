import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useAppReviewPromptOnSuccessfulTransaction } from 'features/appReview/hooks/useAppReviewPromptOnSuccessfulTransaction'
import React, { useCallback } from 'react'

export const TransactionSuccessfulScreen = (): React.JSX.Element => {
  const { title, description, buttonText } = useLocalSearchParams()
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const promptForReview = useAppReviewPromptOnSuccessfulTransaction()

  const renderFooter = (): React.ReactNode => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={() => router.canGoBack() && router.back()}>
        {buttonText}
      </Button>
    )
  }

  useFocusEffect(
    useCallback(() => {
      confetti.restart()
      promptForReview()
    }, [promptForReview])
  )

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16,
        flex: 1
      }}>
      <View sx={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Icons.Action.CheckCircleOutline
          color={colors.$textSuccess}
          width={62.5}
          height={62.5}
        />
        <View sx={{ alignItems: 'center', gap: 20, marginTop: 40 }}>
          <Text
            variant="heading3"
            sx={{ textAlign: 'center', color: colors.$textPrimary }}>
            {title}
          </Text>
          <Text
            variant="subtitle1"
            sx={{ textAlign: 'center', color: colors.$textSecondary }}>
            {description}
          </Text>
        </View>
      </View>
    </ScrollScreen>
  )
}
