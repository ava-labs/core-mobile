import AppCheckService from 'services/fcm/AppCheckService'

export default async function fetchWithAppCheck({
  url,
  method = 'POST',
  bodyJson
}: {
  url: string
  method?: string
  bodyJson?: string
}): Promise<Response> {
  const appCheckToken = await AppCheckService.getToken()

  const headers: HeadersInit = {
    'X-Firebase-AppCheck': appCheckToken.token
  }

  if (bodyJson) {
    headers['Content-Type'] = 'application/json'
  }

  const options: RequestInit = {
    method,
    headers,
    body: bodyJson
  }

  return fetch(url, options)
}
