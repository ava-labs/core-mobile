import AppCheckService from 'services/fcm/AppCheckService'

export const appCheckMiddleware = async (
  request: Request
): Promise<Request> => {
  const appCheckToken = await AppCheckService.getToken()
  request.headers.set('X-Firebase-AppCheck', appCheckToken.token)
  return request
}
