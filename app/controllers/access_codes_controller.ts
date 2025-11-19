// app/controllers/access_code_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'
import {accessCodeValidator} from "#validators/user";

export default class AccessCodeController {
  /**
   * POST /access-code/login
   * Vérifie le code et renvoie un token + user
   */
  async login({ request, response }: HttpContext) {
    const { code } = await request.validateUsing(accessCodeValidator)

    const user = await User.query().where('access_code', code).first()

    if (!user || !user.isActive) {
      return response.unauthorized({
        message: 'Code d’accès invalide',
      })
    }

    user.lastLoginAt = DateTime.now()
    await user.save()

    const token = await User.accessTokens.create(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: {
        type: 'bearer',
        value: token.value!.release(),
        expiresAt: token.expiresAt,
      },
    }
  }
}
