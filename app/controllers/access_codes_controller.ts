import type { HttpContext } from '@adonisjs/core/http'
import {accessCodeValidator} from "#validators/user";
import AccessCode from "#models/access_code";

export default class AccessCodeController {
  /**
   * POST /access-code/login
   * Vérifie le code et renvoie un token + user
   */
  async login({ request, response }: HttpContext) {
    const { code } = await request.validateUsing(accessCodeValidator)

    const user = await AccessCode.query().where('code', code).first()

    if (!user || !user.isActive) {
      return response.unauthorized({
        message: 'Code d’accès invalide',
      })
    }

    // user.lastLoginAt = DateTime.now()
    // await user.save()

    // const token = await User.accessTokens.create(user)

    return {
      data: user,
      status: true,
    }
  }

  /**
   * GET /api/auth/user/list
   */
  async accessList({ }: HttpContext) {
    const access = AccessCode.query().orderBy('id', 'asc')

    return access
  }
}
