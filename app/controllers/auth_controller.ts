import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'
import { loginValidator, registerValidator } from '#validators/user'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const existingUser = await User.query().where('email', payload.email).first()
    if (existingUser) {
      return response.conflict({
        message: 'Cet email est déjà utilisé.',
      })
    }

    const user = await User.create({
      email: payload.email.toLowerCase().trim(),
      password: payload.password,
      firstName: payload.firstName?.trim() || null,
      lastName: payload.lastName?.trim() || null,
      role: payload.role ?? 'COMMERCIAL',
      isActive: true,
    })

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '30 days',
    })

    return response.created({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: {
        type: 'bearer' as const,
        value: token.value!.release(),
        expiresAt: token.expiresAt?.toISOString(),
      },
    })
  }

  async login({ request, response }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(payload.email, payload.password)

    if (!user.isActive) {
      return response.forbidden({ message: 'Votre compte est désactivé.' })
    }

    user.lastLoginAt = DateTime.now()
    await user.save() 

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '30 days',
    })

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: {
        type: 'bearer' as const,
        value: token.value!.release(),
        expiresAt: token.expiresAt?.toISOString(),
      },
    })
  }

  async me({ auth, response }: HttpContext) {
    await auth.authenticate()

    const user = auth.user as User

    return response.ok({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISO(),
    })
  }

  async usersList({ }: HttpContext) {
    const users = await User.query().orderBy('id', 'asc')

    return users
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()

    return response.ok({
      message: 'Déconnexion réussie.',
    })
  }
}
