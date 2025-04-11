/**
 This function checks if a given name is a valid contact name.
 It trims the name and checks if it is not empty or undefined.
 It also uses a regular expression to validate the name format.
 The regex allows alphanumeric characters, some special characters, and spaces.
 If the name is valid, it returns true; otherwise, it returns false.
 */
export const isValidContactName = (name?: string | null): boolean => {
  const trimmedValue = name?.trim()
  // Regex to allow alphanumeric characters and some special characters and spaces
  const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/? ]+$/
  return (
    trimmedValue !== '' &&
    trimmedValue !== undefined &&
    trimmedValue !== null &&
    regex.test(trimmedValue)
  )
}
