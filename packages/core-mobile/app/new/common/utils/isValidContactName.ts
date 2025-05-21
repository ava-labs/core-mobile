/**
 This function checks if a given name is a valid contact name.
 It trims the name and checks if it is not empty or undefined.
 If the name is valid, it returns true; otherwise, it returns false.
 */
export const isValidContactName = (name?: string | null): boolean => {
  const trimmedValue = name?.trim()
  return (
    trimmedValue !== '' && trimmedValue !== undefined && trimmedValue !== null
  )
}
