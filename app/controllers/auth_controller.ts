// app/controllers/auth_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'
import {accessCodeValidator, loginValidator, registerValidator} from "#validators/user";

export default class AuthController {
  /**
   * POST /auth/register
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const existing = await User.findBy('email', payload.email)
    if (existing) {
      return response.conflict({
        message: 'Email déjà utilisé',
      })
    }

    const user = await User.create({
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      role: (payload.role ?? 'COMMERCIAL') as any,
      isActive: true,
      accessCode: payload.accessCode ?? null,
    })

    const token = await User.accessTokens.create(user)

    return response.created({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: {
        type: 'bearer',
        value: token.value!.release(), // valeur à renvoyer au front
        expiresAt: token.expiresAt,
      },
    })
  }

  /**
   * POST /auth/login
   * (email + password)
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      // fournie par withAuthFinder
      const user = await User.verifyCredentials(email, password)

      if (!user.isActive) {
        return response.unauthorized({ message: 'Compte désactivé' })
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
    } catch {
      return response.unauthorized({
        message: 'Identifiants invalides',
      })
    }
  }

  /**
   * GET /auth/me
   * nécessite Authorization: Bearer <token>
   */
  async me({ auth }: HttpContext) {
    const user = await auth.authenticate() // utilise le guard par défaut (api)

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }
  }

  /**
   * POST /auth/logout
   * supprime le token courant
   */
  async logout({ auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const tokenId = user.currentAccessToken?.identifier

    if (!tokenId) {
      return response.badRequest({ message: 'Token introuvable' })
    }

    await User.accessTokens.delete(user, tokenId) // pattern validé par la team Adonis :contentReference[oaicite:1]{index=1}

    return {
      message: 'Déconnexion réussie',
    }
  }
}
