import AppCheckService from 'services/fcm/AppCheckService'

export default async function fetchWithAppCheck(
  url: string,
  bodyJson: string
): Promise<Response> {
  const appCheckToken = await AppCheckService.getToken()
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Firebase-AppCheck': appCheckToken.token
    },
    body: bodyJson
  }
  return fetch(url, options)
}
