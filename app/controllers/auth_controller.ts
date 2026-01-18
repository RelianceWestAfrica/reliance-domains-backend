// app/controllers/auth_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'
import { loginValidator, registerValidator } from '#validators/user'

export default class AuthController {
  /**
   * POST /api/auth/register
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    // Vérifier si l'email existe déjà
    const existingUser = await User.query().where('email', payload.email).first()
    if (existingUser) {
      return response.conflict({
        message: 'Cet email est déjà utilisé.',
      })
    }

    // Création de l'utilisateur
    const user = await User.create({
      email: payload.email.toLowerCase().trim(),
      password: payload.password,
      firstName: payload.firstName?.trim() || null,
      lastName: payload.lastName?.trim() || null,
      role: payload.role ?? 'COMMERCIAL',
      isActive: true,
    })

    // Génération du token API
    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '30 days', // Optionnel : durée personnalisée
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
        value: token.value!.release(), // Libère le token pour l'envoi
        expiresAt: token.expiresAt?.toISOString(),
      },
    })
  }

  /**
   * POST /api/auth/login
   */
  async login({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(loginValidator)

    // @ts-ignore
    const user: User = await User.query().where('email', email).first()

    let pass = await User.hashPassword(user);
    console.log(user)
    console.log(pass)

    if (pass !== user.password) {
      return response.unauthorized({message: 'Mot de passe incorrect'})
    }

    // Vérifications post-auth
    if (!user.isActive) {
      return response.forbidden({ message: 'Votre compte est désactivé.' })
    }

    // Mise à jour de la dernière connexion
    user.lastLoginAt = DateTime.now()
    await user.save() 

    // Création du token
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

  /**
   * GET /api/auth/me
   */
  async me({ auth, response }: HttpContext) {
    await auth.authenticate() // Charge l'utilisateur via le guard API

    const user = auth.user!

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

  /**
   * GET /api/auth/user/list
   */
  async usersList({ }: HttpContext) {
    const users = User.query().orderBy('id', 'asc')

    return users
  }

  /**
   * POST /api/auth/logout
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.user!

    // Récupère le token courant
    const tokenId = auth.authenticationAttempt?.token?.identifier

    if (!tokenId) {
      return response.badRequest({ message: 'Aucun token actif trouvé.' })
    }

    // Suppression du token spécifique (meilleure pratique)
    await User.accessTokens.delete(user, tokenId)

    return response.ok({
      message: 'Déconnexion réussie.',
    })
  }
}
