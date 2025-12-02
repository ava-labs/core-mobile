import AppCheckService from 'services/fcm/AppCheckService'
import { Middleware } from 'openapi-fetch'


export const appCheckMiddleware: Middleware = {
  async onRequest({ request }) {
    const appCheckToken = await AppCheckService.getToken()
    request.headers.set('X-Firebase-AppCheck', appCheckToken.token)
    return request
  }
}