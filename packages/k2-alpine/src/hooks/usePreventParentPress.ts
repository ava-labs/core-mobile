import { useCallback, useRef } from 'react'

/**
 * A hook to prevent parent pressable components from firing when child pressables are pressed.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { handleParentPress, createChildPressHandler } = usePreventParentPress(() => {
 *     console.log('Parent pressed!')
 *   })
 *
 *   const handleChildPress = createChildPressHandler(() => {
 *     console.log('Child pressed!')
 *   })
 *
 *   return (
 *     <AnimatedPressable onPress={handleParentPress}>
 *       <Text>Parent Content</Text>
 *       <TouchableOpacity onPress={handleChildPress}>
 *         <Text>Child Button</Text>
 *       </TouchableOpacity>
 *     </AnimatedPressable>
 *   )
 * }
 * ```
 */
export function usePreventParentPress<T extends any[]>(
  parentPressHandler: (...args: T) => void
): {
  handleParentPress: (...args: T) => void
  createChildPressHandler: <U extends any[]>(
    childPressHandler: (...args: U) => void
  ) => (...args: U) => void
} {
  const childPressedRef = useRef(false)

  const handleParentPress = useCallback(
    (...args: T) => {
      // Only fire parent press if child wasn't pressed
      if (!childPressedRef.current) {
        parentPressHandler(...args)
      }
      // Reset the flag
      childPressedRef.current = false
    },
    [parentPressHandler]
  )

  const createChildPressHandler = useCallback(
    <U extends any[]>(childPressHandler: (...args: U) => void) =>
      (...args: U) => {
        // Set flag to prevent parent press
        childPressedRef.current = true
        childPressHandler(...args)
      },
    []
  )

  return {
    handleParentPress,
    createChildPressHandler
  }
}
